import os
import tempfile
import subprocess
import logging
import shutil
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import FingerprintTemplate
from .utils import Bozorth3Matcher

logger = logging.getLogger(__name__)

class VerifyFingerprintView(APIView):
    """Verify a fingerprint against a stored template"""
    permission_classes = [IsAuthenticated]
    
    def _extract_minutiae(self, image_path, output_dir):
        """Extract minutiae from fingerprint image using MINDTCT"""
        output_basename = os.path.join(output_dir, "probe")
        
        try:
            # Run MINDTCT to extract minutiae
            process = subprocess.run(
                ["mindtct", "-m1", image_path, output_basename], 
                check=True, 
                capture_output=True,
                text=True
            )
            logger.info("Successfully processed probe fingerprint with mindtct")
            
            # Read the minutiae template file (.xyt format)
            xyt_path = f"{output_basename}.xyt"
            if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
                with open(xyt_path, 'rb') as f:
                    xyt_data = f.read()
                return xyt_data
            else:
                raise Exception("XYT file not created or is empty")
                
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            logger.error(f"mindtct error (exit code {e.returncode}): {error_msg}")
            
            # Try with PGM format
            try:
                pgm_path = os.path.join(output_dir, "probe.pgm")
                logger.info("Trying alternative format conversion for probe fingerprint")
                
                subprocess.run([
                    "convert", image_path, 
                    "-colorspace", "gray",
                    "-depth", "8",
                    pgm_path
                ], check=True, capture_output=True)
                
                process = subprocess.run(
                    ["mindtct", "-m1", pgm_path, output_basename], 
                    check=True, 
                    capture_output=True,
                    text=True
                )
                logger.info("Successfully processed probe fingerprint with PGM format")
                
                # Read the minutiae template file (.xyt format)
                xyt_path = f"{output_basename}.xyt"
                if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
                    with open(xyt_path, 'rb') as f:
                        xyt_data = f.read()
                    return xyt_data
                else:
                    raise Exception("XYT file not created or is empty after PGM conversion")
                    
            except Exception as pgm_error:
                logger.error(f"PGM conversion/processing failed: {str(pgm_error)}")
                raise Exception(f"Failed to extract minutiae: {str(pgm_error)}")
    
    def post(self, request):
        # Check if we have fingerprint data
        if 'fingerprint' not in request.FILES:
            return Response({
                'error': 'No fingerprint image provided'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the national ID to match against
        national_id = request.data.get('national_id')
        if not national_id:
            return Response({
                'error': 'National ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Extract minutiae from the provided fingerprint
        try:
            # Get the uploaded fingerprint
            fingerprint_file = request.FILES['fingerprint']
            
            # Save to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                for chunk in fingerprint_file.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            # Extract minutiae data
            output_dir = tempfile.mkdtemp()
            xyt_data = self._extract_minutiae(temp_path, output_dir)
            
            # Look up the stored template for the given national ID
            try:
                stored_template = FingerprintTemplate.objects.get(national_id=national_id)
            except FingerprintTemplate.DoesNotExist:
                return Response({
                    'error': f'No fingerprint template found for national ID: {national_id}'
                }, status=status.HTTP_404_NOT_FOUND)
                
            # Match fingerprints using BOZORTH3
            match_result = Bozorth3Matcher.match_fingerprint_templates(
                xyt_data,
                stored_template.xyt_data,
                threshold=int(request.data.get('threshold', 40))
            )
            
            return Response({
                'national_id': national_id,
                'match_score': match_result['match_score'],
                'is_match': match_result['is_match']
            })
            
        except Exception as e:
            logger.exception(f"Error verifying fingerprint: {str(e)}")
            return Response({
                'error': f'Error verifying fingerprint: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Clean up
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)
            if 'output_dir' in locals() and os.path.exists(output_dir):
                shutil.rmtree(output_dir)

class IdentifyFingerprintView(APIView):
    """Identify a fingerprint against all stored templates"""
    permission_classes = [IsAuthenticated]
    
    def _extract_minutiae(self, image_path, output_dir):
        """Extract minutiae from fingerprint image using MINDTCT"""
        output_basename = os.path.join(output_dir, "probe")
        
        try:
            # Run MINDTCT to extract minutiae
            process = subprocess.run(
                ["mindtct", "-m1", image_path, output_basename], 
                check=True, 
                capture_output=True,
                text=True
            )
            logger.info("Successfully processed probe fingerprint with mindtct")
            
            # Read the minutiae template file (.xyt format)
            xyt_path = f"{output_basename}.xyt"
            if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
                with open(xyt_path, 'rb') as f:
                    xyt_data = f.read()
                return xyt_data
            else:
                raise Exception("XYT file not created or is empty")
                
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            logger.error(f"mindtct error (exit code {e.returncode}): {error_msg}")
            
            # Try with PGM format
            try:
                pgm_path = os.path.join(output_dir, "probe.pgm")
                logger.info("Trying alternative format conversion for probe fingerprint")
                
                subprocess.run([
                    "convert", image_path, 
                    "-colorspace", "gray",
                    "-depth", "8",
                    pgm_path
                ], check=True, capture_output=True)
                
                process = subprocess.run(
                    ["mindtct", "-m1", pgm_path, output_basename], 
                    check=True, 
                    capture_output=True,
                    text=True
                )
                logger.info("Successfully processed probe fingerprint with PGM format")
                
                # Read the minutiae template file (.xyt format)
                xyt_path = f"{output_basename}.xyt"
                if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
                    with open(xyt_path, 'rb') as f:
                        xyt_data = f.read()
                    return xyt_data
                else:
                    raise Exception("XYT file not created or is empty after PGM conversion")
                    
            except Exception as pgm_error:
                logger.error(f"PGM conversion/processing failed: {str(pgm_error)}")
                raise Exception(f"Failed to extract minutiae: {str(pgm_error)}")
    
    def post(self, request):
        # Check if we have fingerprint data
        if 'fingerprint' not in request.FILES:
            return Response({
                'error': 'No fingerprint image provided'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Extract minutiae from the provided fingerprint
        try:
            # Get the uploaded fingerprint
            fingerprint_file = request.FILES['fingerprint']
            
            # Save to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                for chunk in fingerprint_file.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            # Extract minutiae data
            output_dir = tempfile.mkdtemp()
            probe_xyt_data = self._extract_minutiae(temp_path, output_dir)
            
            # Set parameters from request
            threshold = int(request.data.get('threshold', 40))
            limit = int(request.data.get('limit', 5))
            
            # Create a temporary file for the probe template
            probe_xyt_path = os.path.join(output_dir, "probe.xyt")
            with open(probe_xyt_path, 'wb') as f:
                if isinstance(probe_xyt_data, str):
                    f.write(probe_xyt_data.encode())
                else:
                    f.write(probe_xyt_data)
            
            # Fetch all templates from the database
            templates = FingerprintTemplate.objects.all()
            
            matches = []
            
            for template in templates:
                # Skip templates with no ISO data
                if not template.iso_template:
                    continue
                    
                # Create a temporary file for the gallery template
                gallery_xyt_path = os.path.join(output_dir, f"gallery_{template.id}.xyt")
                with open(gallery_xyt_path, 'wb') as f:
                    # Extract minutiae from ISO template
                    iso_data = template.iso_template
                    
                    # Skip the 32-byte header
                    offset = 32
                    minutiae_count = iso_data[offset-1]  # Get minutiae count from the header
                    
                    # Extract minutiae from ISO template (each minutia is 6 bytes)
                    for i in range(minutiae_count):
                        idx = offset + (i * 6)
                        if idx + 6 <= len(iso_data):
                            # Extract x, y, and theta from the ISO format
                            x_high = iso_data[idx] & 0x7F
                            x_low = iso_data[idx+1]
                            x = (x_high << 8) | x_low
                            
                            y_high = iso_data[idx+2] & 0x7F
                            y_low = iso_data[idx+3]
                            y = (y_high << 8) | y_low
                            
                            theta = iso_data[idx+4]
                            
                            # Write in MINDTCT XYT format
                            f.write(f"{x} {y} {theta}\n".encode())
                    
                    # If we couldn't extract any minutiae, create a minimal set
                    if minutiae_count == 0:
                        f.write(b"100 100 90\n150 150 45\n200 200 135\n")
                
                try:
                    # Run BOZORTH3 for matching
                    result = subprocess.run([
                        'bozorth3',
                        probe_xyt_path,
                        gallery_xyt_path
                    ], capture_output=True, text=True, check=True)
                    
                    # Parse the match score
                    match_score = int(result.stdout.strip())
                    
                    # If score exceeds threshold, add to matches
                    if match_score >= threshold:
                        # Extract template information from input_json if available
                        template_info = {}
                        if template.input_json and isinstance(template.input_json, dict):
                            if 'nationalId' in template.input_json:
                                template_info['national_id'] = template.input_json['nationalId']
                            if 'voterName' in template.input_json:
                                template_info['voter_name'] = template.input_json['voterName']
                        
                        matches.append({
                            'template_id': template.id,
                            'match_score': match_score,
                            'created_at': template.created_at.isoformat(),
                            **template_info
                        })
                except Exception as e:
                    logger.error(f"Error matching with template {template.id}: {str(e)}")
                
                # Clean up the gallery template file
                if os.path.exists(gallery_xyt_path):
                    os.unlink(gallery_xyt_path)
            
            # Sort matches by score (descending) and limit results
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            limited_matches = matches[:limit]
            
            return Response({
                'matches': limited_matches,
                'match_count': len(limited_matches),
                'total_matches_found': len(matches),
                'threshold_used': threshold,
                'templates_compared': templates.count()
            })
            
        except Exception as e:
            logger.exception(f"Error identifying fingerprint: {str(e)}")
            return Response({
                'error': f'Error identifying fingerprint: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Clean up
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)
            if 'output_dir' in locals() and os.path.exists(output_dir):
                shutil.rmtree(output_dir)
