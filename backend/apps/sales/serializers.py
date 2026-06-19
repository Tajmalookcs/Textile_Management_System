from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem


class CustomerSerializer(serializers.ModelSerializer):
    ntn_number = serializers.CharField(source='ntn', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    value_excl_tax = serializers.ReadOnlyField()
    sales_tax_amount = serializers.ReadOnlyField()
    value_incl_tax = serializers.ReadOnlyField()
    product_name = serializers.CharField(source='product.name', read_only=True, default='')
    pct_code_display = serializers.CharField(source='pct_code.pct_code', read_only=True, default='')

    class Meta:
        model = InvoiceItem
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    total_excl_tax = serializers.ReadOnlyField()
    total_tax = serializers.ReadOnlyField()
    total_incl_tax = serializers.ReadOnlyField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True, default='')
    customer_str = serializers.CharField(source='customer.str_number', read_only=True, default='')
    customer_ntn = serializers.CharField(source='customer.ntn', read_only=True, default='')
    invoice_no = serializers.CharField(source='invoice_number', required=False)
    total_qty = serializers.SerializerMethodField()
    total_value_excl_tax = serializers.SerializerMethodField()
    total_sales_tax = serializers.SerializerMethodField()
    total_value_incl_tax = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def get_total_qty(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_total_value_excl_tax(self, obj):
        return float(sum(item.value_excl_tax for item in obj.items.all()))

    def get_total_sales_tax(self, obj):
        return float(sum(item.sales_tax_amount for item in obj.items.all()))

    def get_total_value_incl_tax(self, obj):
        return float(sum(item.value_incl_tax for item in obj.items.all()))

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
