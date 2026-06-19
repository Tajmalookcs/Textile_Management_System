from rest_framework import viewsets, permissions
from .models import CompanySettings
from .serializers import CompanySettingsSerializer


class CompanySettingsViewSet(viewsets.ModelViewSet):
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
