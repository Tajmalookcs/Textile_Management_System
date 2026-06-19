import logging
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import CompanySettings
from .serializers import CompanySettingsSerializer

logger = logging.getLogger(__name__)


class CompanySettingsViewSet(viewsets.ModelViewSet):
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'CompanySettings create error: {e}', exc_info=True)
            return Response({'error': 'Failed to save company settings.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'CompanySettings update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update company settings.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
