"""
Global DRF exception handler.
Converts all unhandled exceptions into clean JSON responses
instead of HTML error pages or raw Python exceptions.
"""
import logging
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Called by DRF for every exception raised in a view.
    1. Let DRF handle known API exceptions (ValidationError, NotFound, etc.)
    2. For anything else, return a clean 500 JSON instead of crashing.
    """
    # Try DRF's own handler first
    response = drf_exception_handler(exc, context)

    if response is not None:
        # DRF handled it — add an 'error' key for frontend consistency
        if isinstance(response.data, dict) and 'error' not in response.data:
            # Flatten DRF's default error format into our standard shape
            detail = response.data.get('detail', '')
            if not detail:
                # Collect all field errors into one string
                msgs = []
                for key, val in response.data.items():
                    if isinstance(val, list):
                        msgs.append(f'{key}: {val[0]}')
                    else:
                        msgs.append(f'{key}: {val}')
                detail = ' | '.join(msgs) if msgs else str(response.data)
            response.data['error'] = str(detail)
        return response

    # Unhandled exception — log it and return clean 500
    view = context.get('view', None)
    view_name = view.__class__.__name__ if view else 'unknown'
    logger.error(
        f'Unhandled exception in {view_name}: {type(exc).__name__}: {exc}',
        exc_info=exc,
        extra={'view': view_name},
    )

    return Response(
        {
            'error':  'An unexpected server error occurred. Please try again or contact support.',
            'detail': f'{type(exc).__name__}: {exc}',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
