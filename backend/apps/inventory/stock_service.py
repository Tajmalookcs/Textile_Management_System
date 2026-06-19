"""
Stock auto-update service.
Called whenever an Invoice is marked 'paid' or a PurchaseOrder is marked 'received'.
All exceptions are caught and re-raised with clear messages.
"""
import logging
from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from django.core.exceptions import ObjectDoesNotExist
from .models import Stock, StockTransaction, Warehouse

logger = logging.getLogger(__name__)


def _get_default_warehouse():
    """Return first warehouse, or create a default one if none exist."""
    try:
        w = Warehouse.objects.first()
        if not w:
            w = Warehouse.objects.create(name='Main Warehouse', location='Default')
            logger.info('Created default warehouse: Main Warehouse')
        return w
    except Exception as e:
        logger.error(f'Failed to get/create default warehouse: {e}', exc_info=True)
        raise RuntimeError(f'Cannot access warehouse: {e}')


def _to_decimal(value, field_name='quantity'):
    """Safely convert a value to Decimal."""
    try:
        d = Decimal(str(value))
        if d < 0:
            raise ValueError(f'{field_name} cannot be negative: {value}')
        return d
    except (InvalidOperation, TypeError) as e:
        raise ValueError(f'Invalid {field_name} value "{value}": {e}')


def deduct_stock_for_invoice(invoice, user):
    """
    When an invoice is marked PAID — deduct each item's quantity from stock.
    Returns list of log messages.
    Raises RuntimeError with a user-friendly message on failure.
    """
    if not invoice:
        raise ValueError('Invoice is required.')
    if not user:
        raise ValueError('User is required for audit trail.')

    try:
        warehouse = _get_default_warehouse()
    except RuntimeError as e:
        raise RuntimeError(str(e))

    log = []
    errors = []

    try:
        with db_transaction.atomic():
            items = invoice.items.select_related('product').all()
            if not items.exists():
                logger.warning(f'Invoice {invoice.invoice_number} has no items — no stock deducted.')
                return ['No items on invoice — nothing deducted.']

            for item in items:
                try:
                    if not item.product:
                        logger.warning(f'Invoice item {item.id} has no product — skipping.')
                        continue

                    qty = _to_decimal(item.quantity, 'quantity')

                    stock, created = Stock.objects.get_or_create(
                        product=item.product,
                        warehouse=warehouse,
                        defaults={'quantity': Decimal('0')}
                    )
                    if created:
                        logger.info(f'Created stock record for {item.product.name} in {warehouse.name}')

                    previous_qty = stock.quantity
                    stock.quantity = max(Decimal('0'), stock.quantity - qty)
                    stock.save()

                    StockTransaction.objects.create(
                        product=item.product,
                        warehouse=warehouse,
                        transaction_type='out',
                        quantity=qty,
                        reference=f'INV-{invoice.invoice_number}',
                        notes=f'Auto-deducted on invoice payment. Previous qty: {previous_qty}',
                        created_by=user,
                    )

                    msg = f'Deducted {qty} of {item.product.name} (was {previous_qty}, now {stock.quantity})'
                    log.append(msg)
                    logger.info(msg)

                    if previous_qty < qty:
                        logger.warning(f'Stock went to 0 for {item.product.name} — insufficient stock (needed {qty}, had {previous_qty})')

                except ValueError as e:
                    err = f'Skipped item {item.id}: {e}'
                    errors.append(err)
                    logger.error(err)
                except Exception as e:
                    err = f'Error processing item {item.id} ({getattr(item.product, "name", "unknown")}): {e}'
                    errors.append(err)
                    logger.error(err, exc_info=True)
                    raise  # re-raise to trigger atomic rollback

    except Exception as e:
        logger.error(f'Stock deduction failed for invoice {invoice.invoice_number}: {e}', exc_info=True)
        raise RuntimeError(f'Stock deduction failed: {e}')

    if errors:
        logger.warning(f'Invoice {invoice.invoice_number} stock deduction completed with errors: {errors}')

    return log


def add_stock_for_purchase(purchase_order, user):
    """
    When a PurchaseOrder is marked RECEIVED — add each item's quantity to stock.
    Returns list of log messages.
    Raises RuntimeError with a user-friendly message on failure.
    """
    if not purchase_order:
        raise ValueError('Purchase order is required.')
    if not user:
        raise ValueError('User is required for audit trail.')

    try:
        warehouse = _get_default_warehouse()
    except RuntimeError as e:
        raise RuntimeError(str(e))

    log = []
    errors = []

    try:
        with db_transaction.atomic():
            items = purchase_order.items.select_related('product').all()
            if not items.exists():
                logger.warning(f'PO {purchase_order.po_number} has no items — no stock added.')
                return ['No items on purchase order — nothing added.']

            for item in items:
                try:
                    qty = _to_decimal(item.quantity, 'quantity')

                    stock, created = Stock.objects.get_or_create(
                        product=item.product,
                        warehouse=warehouse,
                        defaults={'quantity': Decimal('0')}
                    )
                    if created:
                        logger.info(f'Created stock record for {item.product.name} in {warehouse.name}')

                    previous_qty = stock.quantity
                    stock.quantity += qty
                    stock.save()

                    StockTransaction.objects.create(
                        product=item.product,
                        warehouse=warehouse,
                        transaction_type='in',
                        quantity=qty,
                        reference=f'PO-{purchase_order.po_number}',
                        notes=f'Auto-added on PO receipt. Previous qty: {previous_qty}',
                        created_by=user,
                    )

                    msg = f'Added {qty} of {item.product.name} (was {previous_qty}, now {stock.quantity})'
                    log.append(msg)
                    logger.info(msg)

                except ValueError as e:
                    err = f'Skipped item {item.id}: {e}'
                    errors.append(err)
                    logger.error(err)
                except Exception as e:
                    err = f'Error processing item {item.id} ({getattr(item.product, "name", "unknown")}): {e}'
                    errors.append(err)
                    logger.error(err, exc_info=True)
                    raise

    except Exception as e:
        logger.error(f'Stock addition failed for PO {purchase_order.po_number}: {e}', exc_info=True)
        raise RuntimeError(f'Stock addition failed: {e}')

    if errors:
        logger.warning(f'PO {purchase_order.po_number} stock addition completed with errors: {errors}')

    return log
