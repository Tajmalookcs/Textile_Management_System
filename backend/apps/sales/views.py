from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Customer, Invoice, InvoiceItem
from .serializers import CustomerSerializer, InvoiceSerializer, InvoiceItemSerializer


@api_view(['GET'])
def ntn_lookup_view(request):
    return Response({'detail': 'FBR NTN lookup not yet integrated.'}, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['GET'])
def str_lookup_view(request):
    return Response({'detail': 'FBR STR lookup not yet integrated.'}, status=status.HTTP_501_NOT_IMPLEMENTED)

LOCKED_STATUSES = ('issued', 'paid', 'cancelled')


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'str_number', 'ntn']


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'customer', 'created_by', 'original_invoice'
    ).prefetch_related('items__pct_code', 'credit_notes').all()
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['invoice_number', 'customer__name']

    def get_queryset(self):
        qs = super().get_queryset()
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        status    = self.request.query_params.get('status')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        invoice = self.get_object()
        # Block editing if FBR submitted or locked status
        if invoice.fbr_status in ('submitted', 'accepted'):
            return Response(
                {'detail': f'This invoice has been submitted to FBR (IRN: {invoice.fbr_irn}). It cannot be edited. Issue a Credit Note instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if invoice.status in ('paid', 'cancelled'):
            return Response(
                {'detail': f'A {invoice.status} invoice cannot be edited.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='next_number')
    def next_number(self, request):
        last = Invoice.objects.order_by('-id').first()
        next_id = (last.id + 1) if last else 1
        return Response({'invoice_no': f'INV-{next_id:06d}'})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'cancelled':
            return Response({'detail': 'Invoice is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        if invoice.fbr_status in ('submitted', 'accepted'):
            return Response(
                {'detail': 'FBR-submitted invoices cannot be cancelled directly. Issue a Credit Note.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason = request.data.get('reason', '')
        invoice.status = 'cancelled'
        invoice.cancellation_reason = reason
        invoice.save(update_fields=['status', 'cancellation_reason'])
        return Response({'detail': 'Invoice cancelled.', 'status': 'cancelled'})

    @action(detail=True, methods=['post'], url_path='credit_note')
    def credit_note(self, request, pk=None):
        original = self.get_object()
        if original.is_credit_note:
            return Response({'detail': 'Cannot create a Credit Note of a Credit Note.'}, status=status.HTTP_400_BAD_REQUEST)
        if original.credit_notes.exists():
            existing = original.credit_notes.first()
            return Response(
                {'detail': f'A Credit Note already exists for this invoice: {existing.invoice_number}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Reason is required for a Credit Note.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate credit note number
        last = Invoice.objects.order_by('-id').first()
        next_id = (last.id + 1) if last else 1
        cn_number = f'CN-{next_id:06d}'

        import datetime
        credit_note = Invoice.objects.create(
            invoice_number=cn_number,
            customer=original.customer,
            date=datetime.date.today(),
            status='issued',
            notes=f'Credit Note for {original.invoice_number}. {reason}',
            created_by=request.user,
            is_credit_note=True,
            original_invoice=original,
            cancellation_reason=reason,
            place_of_supply=original.place_of_supply,
        )

        # Copy items with negative quantities
        for item in original.items.all():
            InvoiceItem.objects.create(
                invoice=credit_note,
                product=item.product,
                pct_code=item.pct_code,
                description=item.description,
                quantity=-abs(item.quantity),
                rate=item.rate,
                sales_tax_rate=item.sales_tax_rate,
            )

        serializer = self.get_serializer(credit_note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.select_related('invoice', 'product', 'pct_code').all()
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        invoice = self.request.query_params.get('invoice')
        if invoice:
            qs = qs.filter(invoice_id=invoice)
        return qs
