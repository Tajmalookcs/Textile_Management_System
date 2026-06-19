from rest_framework import serializers
from .models import ProcessingBatch, BatchInput, BatchOutput


class BatchInputSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = BatchInput
        fields = '__all__'


class BatchOutputSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = BatchOutput
        fields = '__all__'


class ProcessingBatchSerializer(serializers.ModelSerializer):
    inputs = BatchInputSerializer(many=True, read_only=True)
    outputs = BatchOutputSerializer(many=True, read_only=True)

    class Meta:
        model = ProcessingBatch
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
