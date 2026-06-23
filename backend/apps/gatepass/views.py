from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InwardGatePass, InwardGatePassItem
from .serializers import InwardGatePassSerializer, InwardGatePassItemSerializer


class InwardGatePassViewSet(viewsets.ModelViewSet):
    queryset = InwardGatePass.objects.select_related(
        'supplier', 'purchase_order', 'created_by'
    ).prefetch_related('items').all()
    serializer_class = InwardGatePassSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['gate_pass_number', 'supplier_name', 'vehicle_number', 'driver_name']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        if status:
            qs = qs.filter(status=status)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='next_number')
    def next_number(self, request):
        last = InwardGatePass.objects.order_by('-id').first()
        next_id = (last.id + 1) if last else 1
        return Response({'gate_pass_number': f'IGP-{next_id:05d}'})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        gp = self.get_object()
        gp.status = 'approved'
        gp.save(update_fields=['status'])
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        gp = self.get_object()
        gp.status = 'rejected'
        gp.save(update_fields=['status'])
        return Response({'status': 'rejected'})


class InwardGatePassItemViewSet(viewsets.ModelViewSet):
    queryset = InwardGatePassItem.objects.select_related('gate_pass').all()
    serializer_class = InwardGatePassItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        gate_pass = self.request.query_params.get('gate_pass')
        if gate_pass:
            qs = qs.filter(gate_pass_id=gate_pass)
        return qs
