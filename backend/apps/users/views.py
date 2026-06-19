import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        try:
            return Response(UserSerializer(request.user).data)
        except Exception as e:
            logger.error(f'User me endpoint error: {e}', exc_info=True)
            return Response({'error': 'Failed to fetch user profile.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        try:
            password = request.data.get('password', '')
            if password:
                validate_password(password)
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            return Response({'error': 'Password is too weak.', 'detail': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'User create error: {e}', exc_info=True)
            return Response({'error': 'Failed to create user.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            password = request.data.get('password', '')
            if password:
                validate_password(password)
            return super().update(request, *args, **kwargs)
        except ValidationError as e:
            return Response({'error': 'Password is too weak.', 'detail': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'User update error: {e}', exc_info=True)
            return Response({'error': 'Failed to update user.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.pk == request.user.pk:
                return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'User delete error: {e}', exc_info=True)
            return Response({'error': 'Failed to delete user.', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
