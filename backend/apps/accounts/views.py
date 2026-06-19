import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Account, LedgerEntry
from .serializers import AccountSerializer, LedgerEntrySerializer

logger = logging.getLogger(__name__)


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Account create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create account.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Account update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update account.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Account delete error: {e}', exc_info=True)
            return Response({'error': 'Cannot delete account — it may have ledger entries.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LedgerEntryViewSet(viewsets.ModelViewSet):
    queryset = LedgerEntry.objects.select_related('account', 'created_by').all()
    serializer_class = LedgerEntrySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'LedgerEntry create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create ledger entry.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        return Response({'error': 'Ledger entries cannot be deleted — they are permanent financial records.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
