import logging
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from .models import Supplier, PurchaseOrder, PurchaseOrderItem
from .serializers import SupplierSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer
from apps.inventory.stock_service import add_stock_for_purchase

logger = logging.getLogger(__name__)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'str_number', 'ntn']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Supplier create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create supplier.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Supplier update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update supplier.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Supplier delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete supplier — they may have purchase orders.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'created_by').prefetch_related('items__product').all()
    serializer_class = PurchaseOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PurchaseOrder create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create purchase order.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PurchaseOrder update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update purchase order.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance   = serializer.save()
        new_status = instance.status

        if old_status != 'received' and new_status == 'received':
            try:
                log = add_stock_for_purchase(instance, self.request.user)
                logger.info(f'PO {instance.po_number} received — stock updated: {log}')
            except RuntimeError as e:
                # Stock failed but PO is already saved — log clearly, don't crash
                logger.error(f'Stock update failed for PO {instance.po_number}: {e}')
                # Store the error on the PO notes so user can see it
                instance.notes = (instance.notes or '') + f'\n[Stock Error] {e}'
                instance.save(update_fields=['notes'])
            except Exception as e:
                logger.error(f'Unexpected stock error for PO {instance.po_number}: {e}', exc_info=True)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.status == 'received':
                return Response({'error': 'Cannot delete a received purchase order — stock has already been updated.'}, status=status.HTTP_400_BAD_REQUEST)
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PurchaseOrder delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete purchase order.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.select_related('po', 'product').all()
    serializer_class = PurchaseOrderItemSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PurchaseOrderItem create error: {e}', exc_info=True)
            return Response({'error': 'Failed to add item to purchase order.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PurchaseOrderItem delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to remove item.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
