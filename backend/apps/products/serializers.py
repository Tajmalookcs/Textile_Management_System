from rest_framework import serializers
from .models import PCTCode, Category, Unit, Product


class PCTCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCTCode
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    pct_code_detail = PCTCodeSerializer(source='pct_code', read_only=True)
    category_detail = CategorySerializer(source='category', read_only=True)
    unit_detail = UnitSerializer(source='unit', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
