"""
Stock auto-update service.
Called whenever an Invoice is marked 'paid' or a PurchaseOrder is marked 'received'.
"""
from decimal import Decimal
from django.db import transaction as db_transaction
from .models import Stock, StockTransaction, Warehouse


def _get_default_warehouse():
    """Return first warehouse, or create a default one if none exist."""
    w = Warehouse.objects.first()
    if not w:
        w = Warehouse.objects.create(name='Main Warehouse', location='Default')
    return w


def deduct_stock_for_invoice(invoice, user):
    """
    When an invoice is marked PAID:
    - For each invoice item that has a product, deduct quantity from stock.
    - Uses the first/default warehouse.
    - Creates a StockTransaction record for audit trail.
    - Updates the Stock balance (creates record if missing).
    """
    warehouse = _get_default_warehouse()
    log = []

    with db_transaction.atomic():
        for item in invoice.items.select_related('product').all():
            if not item.product:
                continue

            qty = Decimal(str(item.quantity))

            # Get or create stock record
            stock, _ = Stock.objects.get_or_create(
                product=item.product,
                warehouse=warehouse,
                defaults={'quantity': Decimal('0')}
            )

            # Deduct
            stock.quantity = max(Decimal('0'), stock.quantity - qty)
            stock.save()

            # Audit transaction
            StockTransaction.objects.create(
                product=item.product,
                warehouse=warehouse,
                transaction_type='out',
                quantity=qty,
                reference=f'INV-{invoice.invoice_number}',
                notes=f'Auto-deducted on invoice payment',
                created_by=user,
            )
            log.append(f'Deducted {qty} of {item.product.name}')

    return log


def add_stock_for_purchase(purchase_order, user):
    """
    When a PurchaseOrder is marked RECEIVED:
    - For each PO item, add quantity to stock.
    - Uses the first/default warehouse.
    - Creates StockTransaction records for audit trail.
    """
    warehouse = _get_default_warehouse()
    log = []

    with db_transaction.atomic():
        for item in purchase_order.items.select_related('product').all():
            qty = Decimal(str(item.quantity))

            stock, _ = Stock.objects.get_or_create(
                product=item.product,
                warehouse=warehouse,
                defaults={'quantity': Decimal('0')}
            )

            stock.quantity += qty
            stock.save()

            StockTransaction.objects.create(
                product=item.product,
                warehouse=warehouse,
                transaction_type='in',
                quantity=qty,
                reference=f'PO-{purchase_order.po_number}',
                notes=f'Auto-added on PO receipt',
                created_by=user,
            )
            log.append(f'Added {qty} of {item.product.name}')

    return log
