from rest_framework import viewsets, permissions, filters
from .models import PCTCode, Category, Unit, Product
from .serializers import PCTCodeSerializer, CategorySerializer, UnitSerializer, ProductSerializer


class PCTCodeViewSet(viewsets.ModelViewSet):
    queryset = PCTCode.objects.all().order_by('pct_code')
    serializer_class = PCTCodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['pct_code', 'description']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('pct_code', 'category', 'unit').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'barcode', 'description']
