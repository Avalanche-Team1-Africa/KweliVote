"""
Health check views for the KweliVote API.
Used to verify the API is running and connected to required services.
"""

from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.conf import settings
import datetime
import json
import psycopg2
import os
import sys

# Import biometric dependencies conditionally
try:
    import numpy as np
    import sklearn
    from sklearn.cluster import DBSCAN
    BIOMETRIC_IMPORTS_SUCCESSFUL = True
except ImportError:
    BIOMETRIC_IMPORTS_SUCCESSFUL = False

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Basic health check endpoint that returns API status.
    Does not require authentication.
    """
    biometric_enabled = os.environ.get('BIOMETRIC_FUSION_ENABLED', 'False').lower() == 'true'
    
    # Check if biometric processing dependencies are available
    biometric_status = 'unavailable'
    biometric_details = {}
    
    if biometric_enabled:
        try:
            import numpy as np
            from sklearn.cluster import DBSCAN
            biometric_status = 'available'
            biometric_details = {
                'numpy_version': np.__version__,
                'sklearn_version': sklearn.__version__,
                'fusion_parameters': {
                    'eps': os.environ.get('TEMPLATE_FUSION_EPS', '12'),
                    'min_samples': os.environ.get('TEMPLATE_FUSION_MIN_SAMPLES', '2'),
                }
            }
        except ImportError as e:
            biometric_status = 'dependency_error'
            biometric_details = {'error': str(e)}
    
    return JsonResponse({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'environment': 'production' if not settings.DEBUG else 'development',
        'biometric_processing': {
            'status': biometric_status,
            'enabled': biometric_enabled,
            'details': biometric_details
        }
    })

@require_GET
def readiness_check(request):
    """
    More detailed health check that verifies database connectivity.
    Used by Azure to determine if the service is ready to receive traffic.
    """
    status = {
        'api': True,
        'database': False,
        'timestamp': datetime.datetime.now().isoformat(),
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            status['database'] = True
    except Exception as e:
        status['database_error'] = str(e)
    
    # Overall status is healthy only if all components are healthy
    status['healthy'] = all([status['api'], status['database']])
    
    # Return 200 if healthy, 503 if not
    http_status = 200 if status['healthy'] else 503
    
    return JsonResponse(status, status=http_status)


@require_GET
def liveness_check(request):
    """
    Simple liveness check to verify the application is responsive.
    Used by Azure to determine if the service needs to be restarted.
    """
    return JsonResponse({
        'status': 'alive',
        'timestamp': datetime.datetime.now().isoformat(),
    })
