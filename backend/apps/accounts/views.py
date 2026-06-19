from rest_framework import viewsets
from .models import Account, LedgerEntry
from .serializers import AccountSerializer, LedgerEntrySerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class LedgerEntryViewSet(viewsets.ModelViewSet):
    queryset = LedgerEntry.objects.select_related('account', 'created_by').all()
    serializer_class = LedgerEntrySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
