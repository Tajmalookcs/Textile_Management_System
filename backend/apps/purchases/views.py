from rest_framework import viewsets, filters
from .models import Supplier, PurchaseOrder, PurchaseOrderItem
from .serializers import SupplierSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer
from apps.inventory.stock_service import add_stock_for_purchase


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'str_number', 'ntn']


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'created_by').prefetch_related('items').all()
    serializer_class = PurchaseOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance   = serializer.save()
        new_status = instance.status

        # Trigger stock addition when PO transitions to 'received'
        if old_status != 'received' and new_status == 'received':
            try:
                log = add_stock_for_purchase(instance, self.request.user)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f'Stock add failed for PO {instance.po_number}: {e}')


class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.select_related('po', 'product').all()
    serializer_class = PurchaseOrderItemSerializer
