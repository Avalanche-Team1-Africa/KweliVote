from django.urls import path
from .views import ProcessFingerprintTemplateView
from .fingerprint_matching import VerifyFingerprintView, IdentifyFingerprintView

urlpatterns = [
    path('process-fingerprint-template/', ProcessFingerprintTemplateView.as_view(), name='process-fingerprint-template'),
    path('verify-fingerprint/', VerifyFingerprintView.as_view(), name='verify-fingerprint'),
    path('identify-fingerprint/', IdentifyFingerprintView.as_view(), name='identify-fingerprint'),
]