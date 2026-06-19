import logging
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from .models import PCTCode, Category, Unit, Product
from .serializers import PCTCodeSerializer, CategorySerializer, UnitSerializer, ProductSerializer

logger = logging.getLogger(__name__)


class PCTCodeViewSet(viewsets.ModelViewSet):
    queryset = PCTCode.objects.all().order_by('pct_code')
    serializer_class = PCTCodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['pct_code', 'description']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PCTCode create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create PCT code.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PCTCode update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update PCT code.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'PCTCode delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete PCT code — it may be in use on invoices or products.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Category create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create category.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Category delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete category — it may be used by products.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Unit delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete unit — it may be used by products.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('pct_code', 'category', 'unit').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'barcode', 'description']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Product create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create product.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Product update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update product.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Product delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete product — it may be used in invoices, stock, or purchase orders.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
