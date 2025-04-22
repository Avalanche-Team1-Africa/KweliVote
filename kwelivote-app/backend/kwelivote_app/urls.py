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
from .views import (
    api_root, 
    UserViewSet, 
    VoterViewSet, 
    KeyPersonViewSet, 
    CandidateViewSet,
    ResultsCountViewSet
)

# Set up DRF router
router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'voters', VoterViewSet, basename='voter')
router.register(r'keypersons', KeyPersonViewSet, basename='keyperson')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'resultscount', ResultsCountViewSet, basename='resultscount')

urlpatterns = [
    path('', api_root, name='api-root'),  # Root endpoint
    path('admin/', admin.site.urls),  # Admin endpoint
    path('api/', include(router.urls)),  # API endpoints
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),  # DRF browsable API login
]
