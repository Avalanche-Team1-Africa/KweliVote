from django.urls import path
from .views import ProcessFingerprintTemplateView

urlpatterns = [
    path('process-fingerprint-template/', ProcessFingerprintTemplateView.as_view(), name='process-fingerprint-template'),
]