from rest_framework import viewsets
from .models import ProcessingBatch, BatchInput, BatchOutput
from .serializers import ProcessingBatchSerializer, BatchInputSerializer, BatchOutputSerializer


class ProcessingBatchViewSet(viewsets.ModelViewSet):
    queryset = ProcessingBatch.objects.select_related('created_by').prefetch_related('inputs', 'outputs').all()
    serializer_class = ProcessingBatchSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BatchInputViewSet(viewsets.ModelViewSet):
    queryset = BatchInput.objects.select_related('batch', 'product').all()
    serializer_class = BatchInputSerializer


class BatchOutputViewSet(viewsets.ModelViewSet):
    queryset = BatchOutput.objects.select_related('batch', 'product').all()
    serializer_class = BatchOutputSerializer
