from rest_framework import serializers
from .models import FingerprintTemplate

class FingerprintTemplateInputSerializer(serializers.Serializer):
    """Serializer for fingerprint template processing input"""
    fingerprints = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    
class FingerprintTemplateOutputSerializer(serializers.ModelSerializer):
    """Serializer for fingerprint template processing output"""
    class Meta:
        model = FingerprintTemplate
        fields = ['id', 'created_at', 'processing_status', 'iso_template_base64', 'error_message']