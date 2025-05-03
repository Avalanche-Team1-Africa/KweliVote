"""
URL configuration for kwelivote_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    api_root, 
    VoterViewSet, 
    KeyPersonViewSet, 
    CandidateViewSet,
    ResultsCountViewSet,
    KeyPersonTokenObtainPairView,
    get_user_info,
    create_user,
    create_keyperson_with_user,
    save_voter_biometric_template,
    save_keyperson_biometric_template,
    update_voter_biometric_did,
    search_voters,
    search_keypersons
)

# Set up DRF router
router = routers.DefaultRouter()
router.register(r'voters', VoterViewSet, basename='voter')
router.register(r'keypersons', KeyPersonViewSet, basename='keyperson')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'resultscount', ResultsCountViewSet, basename='resultscount')

urlpatterns = [
    path('', api_root, name='api-root'),  # Root endpoint
    path('admin/', admin.site.urls),  # Admin endpoint
    path('api/', include(router.urls)),  # API endpoints
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),  # DRF browsable API login
    
    # JWT Authentication endpoints
    path('api/token/', KeyPersonTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/user/info/', get_user_info, name='user_info'),
    
    # User management endpoints
    path('api/users/', create_user, name='create_user'),
    path('api/keyperson-with-user/', create_keyperson_with_user, name='create_keyperson_with_user'),
    
    # Biometric endpoints
    path('api/voters/<str:voter_id>/biometric-template/', save_voter_biometric_template, name='save_voter_biometric_template'),
    path('api/keypersons/<str:keyperson_id>/biometric-template/', save_keyperson_biometric_template, name='save_keyperson_biometric_template'),
    path('api/voters/<str:voter_id>/biometric-did/', update_voter_biometric_did, name='update_voter_biometric_did'),
    
    # Search endpoints
    path('api/voters/search/', search_voters, name='search_voters'),
    path('api/keypersons/search/', search_keypersons, name='search_keypersons'),
    
    path('api/voters/', include(router.urls)),
    path('api/keypersons/', include(router.urls)),
]
