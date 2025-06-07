import os
import base64
import json
import tempfile
import subprocess
import logging
import shutil
from django.conf import settings
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import FingerprintTemplateInputSerializer, FingerprintTemplateOutputSerializer
from .models import FingerprintTemplate
from .utils import normalize_image
from .fingerprint_processor import FingerprintProcessor

logger = logging.getLogger(__name__)

class ProcessFingerprintTemplateView(APIView):
    """
    API endpoint for processing fingerprint images into ISO templates
    using template fusion for improved quality and consistency
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        """Process fingerprint images and generate ISO template"""
        work_dir = os.path.join(os.getcwd(), "work")
        try:
            # Create working directory
            os.makedirs(work_dir, exist_ok=True)
            
            # Process each fingerprint image
            xyt_paths = []
            for idx, fingerprint in enumerate(request.FILES.getlist('fingerprints')):
                # Save fingerprint image
                image_path = os.path.join(work_dir, f"fingerprint_{idx+1}.png")
                with open(image_path, 'wb') as f:
                    for chunk in fingerprint.chunks():
                        f.write(chunk)
                
                # Extract minutiae
                try:
                    xyt_data = FingerprintProcessor.extract_minutiae(image_path, work_dir)
                    xyt_path = os.path.join(work_dir, f"probe_{idx+1}.xyt")
                    with open(xyt_path, 'wb') as f:
                        f.write(xyt_data)
                    xyt_paths.append(xyt_path)
                except Exception as e:
                    logger.error(f"Failed to process fingerprint {idx+1}: {str(e)}")
                    continue
            
            if not xyt_paths:
                return Response({"error": "No valid fingerprint templates could be generated"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create processor instance
            processor = FingerprintProcessor()
            
            # Fuse minutiae points from all templates
            fused_minutiae = processor.fuse_minutiae_points(xyt_paths)
            
            # Process minutiae through the pipeline
            canonicalized_minutiae = processor.canonicalize_minutiae(fused_minutiae)
            quantized_minutiae = processor.quantize_minutiae(canonicalized_minutiae)
            optimized_minutiae = processor.optimize_minutiae(quantized_minutiae)
            
            # Generate ISO template
            iso_template = processor.generate_iso_template(optimized_minutiae)
            
            # Generate XYT data
            xyt_data = processor.format_xyt_data(optimized_minutiae)
            
            # Generate template hash
            template_hash = processor.generate_template_hash(optimized_minutiae)
            
            # Create response data
            response_data = {
                'iso_template_base64': base64.b64encode(iso_template).decode('utf-8'),
                'xyt_data': base64.b64encode(xyt_data).decode('utf-8'),
                'metadata': {
                    'template_version': '2.0',
                    'creation_method': 'enrollment',
                    'minutiae_count': len(optimized_minutiae),
                    'template_hash': template_hash
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error processing fingerprint template: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        finally:
            # Cleanup
            try:
                shutil.rmtree(work_dir)
            except Exception as e:
                logger.warning(f"Failed to cleanup work directory: {str(e)}")

class VerifyFingerprintView(APIView):
    """Verify a fingerprint against a stored template"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Verify a fingerprint against a stored template"""
        work_dir = os.path.join(os.getcwd(), "work")
        try:
            # Create working directory
            os.makedirs(work_dir, exist_ok=True)
            
            # Process probe fingerprint
            if 'fingerprint' not in request.FILES:
                return Response({"error": "No fingerprint provided"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Save probe fingerprint
            probe_path = os.path.join(work_dir, "probe.png")
            with open(probe_path, 'wb') as f:
                for chunk in request.FILES['fingerprint'].chunks():
                    f.write(chunk)
            
            # Create processor instance
            processor = FingerprintProcessor()
            
            # Extract minutiae from probe
            try:
                probe_xyt_data = processor.extract_minutiae(probe_path, work_dir)
                probe_minutiae = processor.parse_xyt_data(probe_xyt_data)
            except Exception as e:
                logger.error(f"Failed to process probe fingerprint: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process probe minutiae through the pipeline
            probe_minutiae = processor.canonicalize_minutiae(probe_minutiae)
            probe_minutiae = processor.quantize_minutiae(probe_minutiae)
            probe_minutiae = processor.optimize_minutiae(probe_minutiae)
            
            # Format probe XYT data
            probe_xyt_data = processor.format_xyt_data(probe_minutiae)
            
            # Get stored template
            stored_template_data = request.data.get('stored_template')
            if not stored_template_data:
                return Response({"error": "No stored template provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse stored template
            try:
                stored_iso_data = base64.b64decode(stored_template_data)
                stored_minutiae = processor.parse_iso_template(stored_iso_data)
            except Exception as e:
                logger.error(f"Failed to parse stored template: {str(e)}")
                return Response({"error": "Invalid stored template"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process stored minutiae through the pipeline
            stored_minutiae = processor.canonicalize_minutiae(stored_minutiae)
            stored_minutiae = processor.quantize_minutiae(stored_minutiae)
            stored_minutiae = processor.optimize_minutiae(stored_minutiae)
            
            # Format stored XYT data
            stored_xyt_data = processor.format_xyt_data(stored_minutiae)
            
            # Save XYT files for Bozorth3
            probe_xyt_path = os.path.join(work_dir, "probe.xyt")
            stored_xyt_path = os.path.join(work_dir, "stored.xyt")
            
            with open(probe_xyt_path, 'wb') as f:
                f.write(probe_xyt_data)
            with open(stored_xyt_path, 'wb') as f:
                f.write(stored_xyt_data)
            
            # Run Bozorth3 matching
            try:
                result = subprocess.run(
                    ['bozorth3', probe_xyt_path, stored_xyt_path],
                    capture_output=True,
                    text=True,
                    check=True
                )
                match_score = int(result.stdout.strip())
            except Exception as e:
                logger.error(f"Bozorth3 matching failed: {str(e)}")
                return Response({"error": "Matching failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Check if match score exceeds threshold
            threshold = request.data.get('threshold', 40)
            is_match = match_score >= threshold
            
            response_data = {
                'is_match': is_match,
                'match_score': match_score,
                'threshold': threshold
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error verifying fingerprint: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        finally:
            # Cleanup
            try:
                shutil.rmtree(work_dir)
            except Exception as e:
                logger.warning(f"Failed to cleanup work directory: {str(e)}")

class IdentifyFingerprintView(APIView):
    """Identify a fingerprint against a database of templates"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Identify a fingerprint against a database of templates"""
        try:
            # Create working directory
            work_dir = os.path.join(os.getcwd(), "work")
            os.makedirs(work_dir, exist_ok=True)
            
            # Process probe fingerprint
            if 'fingerprint' not in request.FILES:
                return Response({"error": "No fingerprint provided"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Save probe fingerprint
            probe_path = os.path.join(work_dir, "probe.png")
            with open(probe_path, 'wb') as f:
                for chunk in request.FILES['fingerprint'].chunks():
                    f.write(chunk)
            
            # Extract minutiae from probe
            try:
                probe_xyt_data = FingerprintProcessor.extract_minutiae(probe_path, work_dir)
                probe_minutiae = FingerprintProcessor.parse_xyt_data(probe_xyt_data)
            except Exception as e:
                logger.error(f"Failed to process probe fingerprint: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process probe minutiae through the pipeline
            probe_minutiae = FingerprintProcessor.canonicalize_minutiae(probe_minutiae)
            probe_minutiae = FingerprintProcessor.quantize_minutiae(probe_minutiae)
            probe_minutiae = FingerprintProcessor.optimize_minutiae(probe_minutiae)
            
            # Format probe XYT data
            probe_xyt_data = FingerprintProcessor.format_xyt_data(probe_minutiae)
            
            # Write probe XYT file for BOZORTH3
            probe_xyt_path = os.path.join(work_dir, "probe.xyt")
            with open(probe_xyt_path, 'wb') as f:
                f.write(probe_xyt_data)
            
            # Get all stored templates
            stored_templates = FingerprintTemplate.objects.filter(processing_status='completed')
            if not stored_templates:
                return Response({"error": "No stored templates available"}, status=status.HTTP_404_NOT_FOUND)
            
            # Match against each stored template
            match_results = []
            for template in stored_templates:
                try:
                    # Parse stored template minutiae
                    stored_minutiae = FingerprintProcessor.parse_xyt_data(template.xyt_data)
                    
                    # Process stored minutiae through the pipeline
                    stored_minutiae = FingerprintProcessor.canonicalize_minutiae(stored_minutiae)
                    stored_minutiae = FingerprintProcessor.quantize_minutiae(stored_minutiae)
                    stored_minutiae = FingerprintProcessor.optimize_minutiae(stored_minutiae)
                    
                    # Format stored XYT data
                    stored_xyt_data = FingerprintProcessor.format_xyt_data(stored_minutiae)
                    
                    # Write stored XYT file for BOZORTH3
                    stored_xyt_path = os.path.join(work_dir, f"stored_{template.id}.xyt")
                    with open(stored_xyt_path, 'wb') as f:
                        f.write(stored_xyt_data)
                    
                    # Run BOZORTH3 for matching
                    process = subprocess.run(
                        ["bozorth3", probe_xyt_path, stored_xyt_path],
                        check=True,
                        capture_output=True,
                        text=True
                    )
                    match_score = int(process.stdout.strip())
                    logger.info(f"BOZORTH3 match score for template {template.id}: {match_score}")
                    
                    match_results.append({
                        'template_id': template.id,
                        'national_id': template.national_id,
                        'match_score': match_score,
                        'stored_minutiae_count': len(stored_minutiae)
                    })
                    
                except Exception as e:
                    logger.error(f"Error matching against template {template.id}: {str(e)}")
                    continue
            
            # Sort results by match score in descending order
            match_results.sort(key=lambda x: x['match_score'], reverse=True)
            
            return Response({
                'probe_minutiae_count': len(probe_minutiae),
                'match_results': match_results
            })
            
        except Exception as e:
            logger.error(f"Error identifying fingerprint: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        finally:
            # Cleanup temporary files
            shutil.rmtree(work_dir, ignore_errors=True)
