from rest_framework import serializers
from .models import Warehouse, StockTransaction, Stock


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class StockTransactionSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.SerializerMethodField()

    class Meta:
        model = StockTransaction
        fields = '__all__'

    def get_created_by_detail(self, obj):
        return {'id': obj.created_by.id, 'username': obj.created_by.username}

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    unit = serializers.CharField(source='product.unit.abbreviation', read_only=True)

    class Meta:
        model = Stock
        fields = '__all__'
