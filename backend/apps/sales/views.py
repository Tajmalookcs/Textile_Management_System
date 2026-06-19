import logging
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Customer, Invoice, InvoiceItem
from .serializers import CustomerSerializer, InvoiceSerializer, InvoiceItemSerializer
from .pral_service import submit_invoice
from .ntn_lookup import lookup_ntn, lookup_str
from apps.inventory.stock_service import deduct_stock_for_invoice

logger = logging.getLogger(__name__)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'str_number', 'ntn']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Customer create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create customer.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Customer update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update customer.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Customer delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete customer — they may have invoices.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer', 'created_by').prefetch_related('items__pct_code', 'items__product').all()
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['invoice_number', 'customer__name']

    def get_queryset(self):
        qs = super().get_queryset()
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        status_f  = self.request.query_params.get('status')
        if date_from: qs = qs.filter(date__gte=date_from)
        if date_to:   qs = qs.filter(date__lte=date_to)
        if status_f:  qs = qs.filter(status=status_f)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Invoice create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create invoice.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Invoice update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update invoice.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance   = serializer.save()
        new_status = instance.status

        # ── FBR submission when invoice → issued ──
        if old_status != 'issued' and new_status == 'issued':
            try:
                result = submit_invoice(instance)
                if result['success']:
                    instance.fbr_status       = 'accepted'
                    instance.fbr_irn          = result.get('irn', '')
                    instance.fbr_qr_code      = result.get('qr_code', '')
                    instance.fbr_submitted_at = timezone.now()
                    instance.fbr_error        = ''
                    logger.info(f'Invoice {instance.invoice_number} submitted to FBR — IRN: {instance.fbr_irn}')
                else:
                    instance.fbr_status = 'error'
                    instance.fbr_error  = result.get('error', 'Unknown FBR error')
                    logger.warning(f'Invoice {instance.invoice_number} FBR submission failed: {instance.fbr_error}')
                instance.save(update_fields=['fbr_status', 'fbr_irn', 'fbr_qr_code', 'fbr_submitted_at', 'fbr_error'])
            except Exception as e:
                # FBR error must never block invoice from being issued
                logger.error(f'FBR submission exception for invoice {instance.invoice_number}: {e}', exc_info=True)
                try:
                    instance.fbr_status = 'error'
                    instance.fbr_error  = f'Unexpected error: {e}'
                    instance.save(update_fields=['fbr_status', 'fbr_error'])
                except Exception:
                    pass

        # ── Stock deduction when invoice → paid ──
        if old_status != 'paid' and new_status == 'paid':
            try:
                log = deduct_stock_for_invoice(instance, self.request.user)
                logger.info(f'Invoice {instance.invoice_number} paid — stock deducted: {log}')
            except RuntimeError as e:
                # Stock failed but invoice is saved — append error to notes
                logger.error(f'Stock deduction failed for invoice {instance.invoice_number}: {e}')
                try:
                    instance.notes = (instance.notes or '') + f'\n[Stock Error] {e}'
                    instance.save(update_fields=['notes'])
                except Exception:
                    pass
            except Exception as e:
                logger.error(f'Unexpected stock error for invoice {instance.invoice_number}: {e}', exc_info=True)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.status in ('issued', 'paid'):
                return Response({'error': f'Cannot delete a {instance.status} invoice. Cancel it first.'}, status=status.HTTP_400_BAD_REQUEST)
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Invoice delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to delete invoice.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='next_number')
    def next_number(self, request):
        try:
            last = Invoice.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            return Response({'invoice_no': f'INV-{next_id:06d}'})
        except Exception as e:
            logger.error(f'next_number error: {e}', exc_info=True)
            return Response({'error': 'Failed to generate invoice number.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.select_related('invoice', 'product', 'pct_code').all()
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        invoice = self.request.query_params.get('invoice')
        if invoice:
            qs = qs.filter(invoice_id=invoice)
        return qs

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'InvoiceItem create error: {e}', exc_info=True)
            return Response({'error': 'Failed to add invoice item.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'InvoiceItem update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update invoice item.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'InvoiceItem delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to remove invoice item.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── NTN / STR Lookup endpoints ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ntn_lookup_view(request):
    ntn = request.query_params.get('ntn', '').strip()
    if not ntn:
        return Response({'error': 'ntn parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        result = lookup_ntn(ntn)
        return Response(result)
    except Exception as e:
        logger.error(f'NTN lookup view error for {ntn}: {e}', exc_info=True)
        return Response({'found': False, 'error': 'NTN lookup service is unavailable. Fill details manually.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def str_lookup_view(request):
    str_number = request.query_params.get('str', '').strip()
    if not str_number:
        return Response({'error': 'str parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        result = lookup_str(str_number)
        return Response(result)
    except Exception as e:
        logger.error(f'STR lookup view error for {str_number}: {e}', exc_info=True)
        return Response({'found': False, 'error': 'STR# lookup service is unavailable. Fill details manually.'}, status=status.HTTP_200_OK)
