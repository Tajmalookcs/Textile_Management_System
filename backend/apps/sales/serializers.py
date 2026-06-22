from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem


class CustomerSerializer(serializers.ModelSerializer):
    ntn_number = serializers.CharField(source='ntn', read_only=True)

    class Meta:
        model  = Customer
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    value_excl_tax   = serializers.ReadOnlyField()
    sales_tax_amount = serializers.ReadOnlyField()
    value_incl_tax   = serializers.ReadOnlyField()
    product_name     = serializers.CharField(source='product.name', read_only=True, default='')
    pct_code_display = serializers.CharField(source='pct_code.pct_code', read_only=True, default='')

    class Meta:
        model  = InvoiceItem
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    items                = InvoiceItemSerializer(many=True, read_only=True)
    total_excl_tax       = serializers.ReadOnlyField()
    total_tax            = serializers.ReadOnlyField()
    total_incl_tax       = serializers.ReadOnlyField()
    customer_name        = serializers.CharField(source='customer.name', read_only=True)
    customer_address     = serializers.CharField(source='customer.address', read_only=True, default='')
    customer_str         = serializers.CharField(source='customer.str_number', read_only=True, default='')
    customer_ntn         = serializers.CharField(source='customer.ntn', read_only=True, default='')
    customer_province    = serializers.CharField(source='customer.province', read_only=True, default='')
    customer_ntn_verified = serializers.BooleanField(source='customer.ntn_verified', read_only=True)
    invoice_no              = serializers.CharField(source='invoice_number', required=False)
    place_of_supply_display = serializers.SerializerMethodField()
    total_qty               = serializers.SerializerMethodField()
    total_value_excl_tax    = serializers.SerializerMethodField()
    total_sales_tax         = serializers.SerializerMethodField()
    total_value_incl_tax    = serializers.SerializerMethodField()
    original_invoice_number = serializers.CharField(source='original_invoice.invoice_number', read_only=True, default='')
    credit_notes_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Invoice
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'fbr_irn', 'fbr_qr_code', 'fbr_submitted_at', 'fbr_error']

    def get_place_of_supply_display(self, obj):
        return obj.get_place_of_supply_display()

    def get_total_qty(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_total_value_excl_tax(self, obj):
        return float(sum(item.value_excl_tax for item in obj.items.all()))

    def get_total_sales_tax(self, obj):
        return float(sum(item.sales_tax_amount for item in obj.items.all()))

    def get_total_value_incl_tax(self, obj):
        return float(sum(item.value_incl_tax for item in obj.items.all()))

    def get_credit_notes_count(self, obj):
        return obj.credit_notes.count()

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
