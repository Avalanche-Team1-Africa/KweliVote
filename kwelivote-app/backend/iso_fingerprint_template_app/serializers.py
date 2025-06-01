from rest_framework import serializers
from .models import FingerprintTemplate

class FingerprintTemplateInputSerializer(serializers.Serializer):
    """Serializer for fingerprint template processing input"""
    fingerprints = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    nationalId = serializers.CharField(
        required=True,
        max_length=50,
        help_text="National ID for the person these fingerprints belong to"
    )
    
class FingerprintTemplateOutputSerializer(serializers.ModelSerializer):
    """Serializer for fingerprint template processing output"""
    class Meta:
        model = FingerprintTemplate
        fields = ['id', 'created_at', 'processing_status', 'iso_template_base64', 'error_message', 'national_id', 'metadata']