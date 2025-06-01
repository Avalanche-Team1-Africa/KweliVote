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
    metadata = models.JSONField(null=True, blank=True, help_text="Helper data for template fusion and verification")
    national_id = models.CharField(max_length=50, null=False, blank=False, db_index=True, help_text="National ID for the person this fingerprint belongs to")
    xyt_data = models.BinaryField(null=True, blank=True, help_text="Raw MINDTCT XYT data for use with BOZORTH3")
    
    def __str__(self):
        if self.national_id:
            return f"Template {self.id} - National ID: {self.national_id} - Status: {self.processing_status}"
        return f"Template {self.id} - Status: {self.processing_status}"
