import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Warehouse, StockTransaction, Stock
from .serializers import WarehouseSerializer, StockTransactionSerializer, StockSerializer

logger = logging.getLogger(__name__)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Warehouse create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create warehouse.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Warehouse delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete warehouse — it has stock records or transactions.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = StockTransaction.objects.select_related('product', 'warehouse', 'created_by').all()
    serializer_class = StockTransactionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'StockTransaction create error: {e}', exc_info=True)
            return Response({'error': 'Failed to record stock transaction.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        return Response({'error': 'Stock transactions cannot be deleted — they are audit records.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stock.objects.select_related('product', 'warehouse').all()
    serializer_class = StockSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Stock list error: {e}', exc_info=True)
            return Response({'error': 'Failed to fetch stock levels.', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
