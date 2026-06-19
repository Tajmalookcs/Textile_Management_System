import logging
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, Invoice, InvoiceItem
from .serializers import CustomerSerializer, InvoiceSerializer, InvoiceItemSerializer
from .pral_service import submit_invoice
from apps.inventory.stock_service import deduct_stock_for_invoice

logger = logging.getLogger(__name__)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'str_number', 'ntn']


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer', 'created_by').prefetch_related('items__pct_code').all()
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

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance   = serializer.save()
        new_status = instance.status

        # ── FBR submission: trigger when invoice transitions to 'issued' ──
        if old_status != 'issued' and new_status == 'issued':
            result = submit_invoice(instance)
            if result['success']:
                instance.fbr_status       = 'accepted'
                instance.fbr_irn          = result.get('irn', '')
                instance.fbr_qr_code      = result.get('qr_code', '')
                instance.fbr_submitted_at = timezone.now()
                instance.fbr_error        = ''
            else:
                instance.fbr_status = 'error'
                instance.fbr_error  = result.get('error', 'Unknown error')
            instance.save(update_fields=['fbr_status', 'fbr_irn', 'fbr_qr_code', 'fbr_submitted_at', 'fbr_error'])

        # ── Stock deduction: trigger when invoice transitions to 'paid' ──
        if old_status != 'paid' and new_status == 'paid':
            try:
                deduct_stock_for_invoice(instance, self.request.user)
            except Exception as e:
                logger.error(f'Stock deduction failed for invoice {instance.invoice_number}: {e}')

    @action(detail=False, methods=['get'], url_path='next_number')
    def next_number(self, request):
        last = Invoice.objects.order_by('-id').first()
        next_id = (last.id + 1) if last else 1
        return Response({'invoice_no': f'INV-{next_id:06d}'})


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.select_related('invoice', 'product', 'pct_code').all()
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        invoice = self.request.query_params.get('invoice')
        if invoice:
            qs = qs.filter(invoice_id=invoice)
        return qs
