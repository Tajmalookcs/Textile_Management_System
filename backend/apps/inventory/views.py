from rest_framework import viewsets
from .models import Warehouse, StockTransaction, Stock
from .serializers import WarehouseSerializer, StockTransactionSerializer, StockSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = StockTransaction.objects.select_related('product', 'warehouse', 'created_by').all()
    serializer_class = StockTransactionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stock.objects.select_related('product', 'warehouse').all()
    serializer_class = StockSerializer
