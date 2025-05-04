from django.db import models

class FingerprintTemplate(models.Model):
    """Model to store ISO fingerprint templates and processing results"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    input_json = models.JSONField(null=True, blank=True)
    iso_template = models.BinaryField(null=True, blank=True)
    iso_template_base64 = models.TextField(null=True, blank=True)
    processing_status = models.CharField(max_length=50, default='pending')
    error_message = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"Template {self.id} - Status: {self.processing_status}"
