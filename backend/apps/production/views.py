import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import ProcessingBatch, BatchInput, BatchOutput
from .serializers import ProcessingBatchSerializer, BatchInputSerializer, BatchOutputSerializer

logger = logging.getLogger(__name__)


class ProcessingBatchViewSet(viewsets.ModelViewSet):
    queryset = ProcessingBatch.objects.select_related('created_by').prefetch_related('inputs__product', 'outputs__product').all()
    serializer_class = ProcessingBatchSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Batch create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create batch.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Batch update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update batch.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.status == 'completed':
                return Response({'error': 'Cannot delete a completed batch.'}, status=status.HTTP_400_BAD_REQUEST)
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Batch delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to delete batch.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BatchInputViewSet(viewsets.ModelViewSet):
    queryset = BatchInput.objects.select_related('batch', 'product').all()
    serializer_class = BatchInputSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'BatchInput create error: {e}', exc_info=True)
            return Response({'error': 'Failed to add batch input.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'BatchInput delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to remove batch input.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BatchOutputViewSet(viewsets.ModelViewSet):
    queryset = BatchOutput.objects.select_related('batch', 'product').all()
    serializer_class = BatchOutputSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'BatchOutput create error: {e}', exc_info=True)
            return Response({'error': 'Failed to add batch output.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'BatchOutput delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to remove batch output.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
