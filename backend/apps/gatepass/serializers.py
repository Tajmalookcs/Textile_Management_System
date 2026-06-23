from rest_framework import serializers
from .models import InwardGatePass, InwardGatePassItem


class InwardGatePassItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InwardGatePassItem
        fields = '__all__'


class InwardGatePassSerializer(serializers.ModelSerializer):
    items           = InwardGatePassItemSerializer(many=True, read_only=True)
    supplier_label  = serializers.CharField(source='supplier.name', read_only=True, default='')
    po_number       = serializers.CharField(source='purchase_order.po_number', read_only=True, default='')
    status_display  = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InwardGatePass
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
