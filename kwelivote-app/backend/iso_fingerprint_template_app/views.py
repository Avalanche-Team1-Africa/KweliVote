import os
import base64
import json
import tempfile
import subprocess
from django.conf import settings
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import FingerprintTemplateInputSerializer, FingerprintTemplateOutputSerializer
from .models import FingerprintTemplate

class ProcessFingerprintTemplateView(APIView):
    """
    API endpoint for processing fingerprint images into ISO templates
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        serializer = FingerprintTemplateInputSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Create database record
        fingerprint_template = FingerprintTemplate.objects.create(
            input_json=serializer.validated_data,
            processing_status='processing'
        )
        
        try:
            # Create temporary working directory
            with tempfile.TemporaryDirectory() as work_dir:
                fingerprints = serializer.validated_data.get('fingerprints', [])
                bmp_paths = []
                xyt_paths = []
                
                # Process each fingerprint
                for idx, fp in enumerate(fingerprints):
                    base64_img = fp.get('sample', '')
                    if not base64_img:
                        continue
                        
                    # Extract and save PNG
                    png_path = os.path.join(work_dir, f"finger_{idx + 1}.png")
                    with open(png_path, "wb") as out:
                        out.write(base64.b64decode(base64_img))
                        
                    # Convert to 8-bit grayscale BMP using ImageMagick
                    bmp_path = os.path.join(work_dir, f"finger_{idx + 1}.bmp")
                    subprocess.run(["convert", png_path, "-type", "Grayscale", "-depth", "8", bmp_path], 
                                  check=True)
                    
                    # Extract minutiae with mindtct instead of img2xyt
                    output_prefix = os.path.join(work_dir, f"finger_{idx + 1}")
                    subprocess.run(["mindtct", bmp_path, output_prefix], check=True)
                    
                    # mindtct creates multiple files including a .xyt file
                    xyt_path = f"{output_prefix}.xyt"
                    xyt_paths.append(xyt_path)
                
                # Create ISO template from all XYT files
                if xyt_paths:
                    iso_output = os.path.join(work_dir, "combined_fingerprint_template.iso")
                    
                    # Instead of using xyt2iso, manually create a simplified ISO template
                    with open(iso_output, 'wb') as iso_file:
                        # Write ISO/IEC 19794-2 header (simplified)
                        iso_file.write(b"FMR\x00")  # Format identifier
                        iso_file.write((0).to_bytes(4, byteorder='big'))  # Version
                        iso_file.write(len(xyt_paths).to_bytes(2, byteorder='big'))  # Number of fingerprints
                        
                        # Append minutiae data from all XYT files
                        for xyt_file in xyt_paths:
                            with open(xyt_file, "r") as f:
                                for line in f:
                                    parts = line.strip().split()
                                    if len(parts) >= 3:  # X, Y, Theta
                                        x = int(parts[0])
                                        y = int(parts[1])
                                        theta = int(parts[2])
                                        # Write minutia point (simplified format)
                                        iso_file.write(x.to_bytes(2, byteorder='big'))
                                        iso_file.write(y.to_bytes(2, byteorder='big'))
                                        iso_file.write(theta.to_bytes(1, byteorder='big'))
                                        iso_file.write((1).to_bytes(1, byteorder='big'))  # Type (placeholder)
                    
                    # Read ISO template and convert to base64
                    with open(iso_output, 'rb') as iso_file:
                        iso_data = iso_file.read()
                        iso_base64 = base64.b64encode(iso_data).decode('ascii')
                        
                        # Update record with template
                        fingerprint_template.iso_template = iso_data
                        fingerprint_template.iso_template_base64 = iso_base64
                        fingerprint_template.processing_status = 'completed'
                        fingerprint_template.save()
                        
            # Return successful response
            output_serializer = FingerprintTemplateOutputSerializer(fingerprint_template)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
                    
        except Exception as e:
            # Update record with error
            fingerprint_template.processing_status = 'failed'
            fingerprint_template.error_message = str(e)
            fingerprint_template.save()
            
            return Response({
                'error': 'Failed to process fingerprints',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
