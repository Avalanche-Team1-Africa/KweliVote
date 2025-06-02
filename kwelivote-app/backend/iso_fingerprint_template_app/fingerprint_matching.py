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
from .utils import Bozorth3Matcher, extract_minutiae, normalize_image

logger = logging.getLogger(__name__)

class VerifyFingerprintView(APIView):
    """Verify a fingerprint against a stored template"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # CHANGED: Align with ProcessFingerprintTemplateView by accepting the same request format
        # The new format uses a JSON payload with base64-encoded fingerprint
        try:
            # Check if required fields are present
            if not request.data.get('nationalId'):
                return Response({
                    'error': 'National ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not request.data.get('fingerprints'):
                return Response({
                    'error': 'Fingerprints data is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get parameters
            national_id = request.data.get('nationalId')
            fingerprints = request.data.get('fingerprints', [])
            template = request.data.get('template', None)
            threshold = int(request.data.get('threshold', 40))
            
            logger.info(f"Verifying fingerprint for national ID: {national_id}")
            logger.info(f"Template provided: {'Yes' if template else 'No'}")
            
            if not fingerprints or len(fingerprints) == 0:
                return Response({
                    'error': 'At least one fingerprint is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process the first fingerprint (could be extended to use multiple)
            fp = fingerprints[0]
            base64_img = fp.get('sample', '')
            
            if not base64_img:
                return Response({
                    'error': 'Fingerprint sample is empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create temporary working directory
            with tempfile.TemporaryDirectory() as work_dir:
                # Extract raw image data from base64 string
                try:
                    # Remove any potential data URL prefix
                    if ',' in base64_img:
                        base64_img = base64_img.split(',', 1)[1]
                    
                    # Decode and normalize the image - IDENTICAL to template generation
                    image_data = base64.b64decode(base64_img)
                    image_data = normalize_image(image_data)  # Same normalization as in template generation
                except Exception as e:
                    logger.error(f"Failed to decode/normalize base64 image: {str(e)}")
                    return Response({
                        'error': f'Failed to decode fingerprint image: {str(e)}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Save decoded image directly as PNG - same format as template generation
                png_path = os.path.join(work_dir, "verify_finger.png")
                with open(png_path, "wb") as out:
                    out.write(image_data)
                
                logger.info(f"Saved normalized fingerprint image for verification")
                
                # Extract minutiae using IDENTICAL process as template generation
                try:
                    # Use the shared extraction function to ensure consistency with enrollment
                    xyt_data = extract_minutiae(png_path, work_dir)
                    
                    # Write the data to the expected xyt file
                    xyt_path = os.path.join(work_dir, "verify_finger.xyt")
                    with open(xyt_path, 'wb') as f:
                        f.write(xyt_data)
                    
                    logger.info(f"Successfully processed verification fingerprint with shared extraction function")
                except Exception as e:
                    logger.error(f"Minutiae extraction error: {str(e)}")
                    return Response({
                        'error': f'Failed to extract minutiae from fingerprint: {str(e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Look up the stored template for the given national ID if not provided
                stored_template = None
                try:
                    if template:
                        # Decode the provided template (base64 to binary)
                        try:
                            logger.info(f"Using provided template - length: {len(template)}")
                            stored_template_data = base64.b64decode(template)
                            logger.info(f"Decoded template size: {len(stored_template_data)} bytes")
                        except Exception as e:
                            logger.error(f"Error decoding template: {str(e)}")
                            return Response({
                                'error': f'Invalid template format: {str(e)}'
                            }, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # Fetch from database
                        stored_template = FingerprintTemplate.objects.get(national_id=national_id)
                        stored_template_data = stored_template.xyt_data
                        logger.info(f"Found template in database for national ID: {national_id}")
                except FingerprintTemplate.DoesNotExist:
                    return Response({
                        'error': f'No fingerprint template found for national ID: {national_id}'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Match fingerprints using BOZORTH3
                # The enhanced Bozorth3Matcher will handle conversion from ISO to XYT format if needed
                match_result = Bozorth3Matcher.match_fingerprint_templates(
                    xyt_data,
                    stored_template_data,
                    threshold=threshold
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
                
                # Match fingerprints using BOZORTH3
                match_result = Bozorth3Matcher.match_fingerprint_templates(
                    xyt_data,
                    stored_template_data,
                    threshold=threshold
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

class IdentifyFingerprintView(APIView):
    """Identify a fingerprint against all stored templates"""
    permission_classes = [IsAuthenticated]
    
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
            probe_xyt_data = extract_minutiae(temp_path, output_dir)
            
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
                        # Get the national_id from the template (now guaranteed to be present)
                        template_info = {
                            'national_id': template.national_id,
                            'match_score': match_score,
                            'template_id': template.id
                        }
                        
                        # Add additional info from input_json if available
                        if template.input_json and isinstance(template.input_json, dict):
                            if 'voterName' in template.input_json:
                                template_info['voter_name'] = template.input_json['voterName']
                                
                        logger.info(f"Found fingerprint match for national ID: {template.national_id} with score: {match_score}")
                        matches.append(template_info)
                        
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
