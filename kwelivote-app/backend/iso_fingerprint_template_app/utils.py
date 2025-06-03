import os
import tempfile
import subprocess
import logging
import shutil
import numpy as np
import cv2
import io
import PIL.Image
import base64

logger = logging.getLogger(__name__)

"""
IMPORTANT: These utility functions ensure consistent fingerprint processing
across the application. They are used by both template creation and fingerprint
matching processes to guarantee that the same algorithms, parameters, and
processing steps are applied uniformly. 

This consistency is critical for accurate fingerprint matching. Any change to 
these functions must be thoroughly tested to ensure it doesn't reduce match accuracy.
"""

def normalize_image(image_data):
    """
    Normalize fingerprint image: resize, grayscale, histogram equalization.
    Returns normalized PNG bytes.
    
    Args:
        image_data: Binary image data
        
    Returns:
        Normalized PNG image data as bytes
    """
    logger.info(f"Normalizing fingerprint image, input size: {len(image_data)} bytes")
    
    try:
        # Read image from bytes
        img = PIL.Image.open(io.BytesIO(image_data)).convert('L')  # Grayscale
        original_size = img.size
        logger.info(f"Original image size: {original_size[0]}x{original_size[1]}")
        
        # Always resize to 500x500 for consistency
        target_size = (500, 500)
        logger.info(f"Resizing image to {target_size[0]}x{target_size[1]}")
        img = img.resize(target_size, PIL.Image.BILINEAR)
        
        # Convert to numpy array for further processing
        img_np = np.array(img)
        
        # Apply histogram equalization for contrast enhancement
        logger.info("Applying histogram equalization")
        img_eq = cv2.equalizeHist(img_np)
        
        # Save as PNG with consistent settings
        logger.info("Encoding as PNG")
        _, buf = cv2.imencode('.png', img_eq)
        normalized_data = buf.tobytes()
        
        logger.info(f"Normalized image size: {len(normalized_data)} bytes")
        return normalized_data
        
    except Exception as e:
        logger.error(f"Error normalizing image: {str(e)}")
        raise Exception(f"Image normalization failed: {str(e)}")

def extract_minutiae(image_path, output_dir):
    """
    Extract minutiae from fingerprint image using MINDTCT
    
    Args:
        image_path: Path to the fingerprint image file
        output_dir: Directory to store the output files
        
    Returns:
        Binary XYT template data
    """
    output_basename = os.path.join(output_dir, "probe")
    
    logger.info(f"Extracting minutiae from image: {os.path.basename(image_path)}")
    logger.info(f"Image size: {os.path.getsize(image_path)} bytes")
    
    try:
        # Log detailed parameters used for minutiae extraction
        logger.info(f"Running MINDTCT with parameters: -m1 {image_path} {output_basename}")
        
        # Run MINDTCT to extract minutiae
        process = subprocess.run(
            ["mindtct", "-m1", image_path, output_basename], 
            check=True, 
            capture_output=True,
            text=True
        )
        logger.info("Successfully processed fingerprint with mindtct")
        
        # Read the minutiae template file (.xyt format)
        xyt_path = f"{output_basename}.xyt"
        if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
            with open(xyt_path, 'rb') as f:
                xyt_data = f.read()
            
            # Log the minutiae count for debugging
            minutiae_count = len(xyt_data.splitlines()) if isinstance(xyt_data, str) else xyt_data.count(b'\n') + 1
            logger.info(f"Extracted {minutiae_count} minutiae points from fingerprint")
            logger.info(f"XYT data size: {len(xyt_data)} bytes")
            
            return xyt_data
        else:
            logger.error(f"XYT file not created or is empty: {xyt_path}")
            raise Exception("XYT file not created or is empty")
            
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        logger.error(f"mindtct error (exit code {e.returncode}): {error_msg}")
        
        # Try with PGM format
        try:
            pgm_path = os.path.join(output_dir, "probe.pgm")
            logger.info("Trying alternative format conversion for fingerprint")
            
            # Log the conversion command
            convert_cmd = f"convert {image_path} -colorspace gray -depth 8 {pgm_path}"
            logger.info(f"Running conversion: {convert_cmd}")
            
            subprocess.run([
                "convert", image_path, 
                "-colorspace", "gray",
                "-depth", "8",
                pgm_path
            ], check=True, capture_output=True)
            
            logger.info(f"Running MINDTCT with PGM format: -m1 {pgm_path} {output_basename}")
            process = subprocess.run(
                ["mindtct", "-m1", pgm_path, output_basename], 
                check=True, 
                capture_output=True,
                text=True
            )
            logger.info("Successfully processed fingerprint with PGM format")
            
            # Read the minutiae template file (.xyt format)
            xyt_path = f"{output_basename}.xyt"
            if os.path.exists(xyt_path) and os.path.getsize(xyt_path) > 0:
                with open(xyt_path, 'rb') as f:
                    xyt_data = f.read()
                
                # Log the minutiae count for debugging
                minutiae_count = len(xyt_data.splitlines()) if isinstance(xyt_data, str) else xyt_data.count(b'\n') + 1
                logger.info(f"Extracted {minutiae_count} minutiae points from fingerprint (PGM format)")
                logger.info(f"XYT data size: {len(xyt_data)} bytes")
                
                return xyt_data
            else:
                logger.error(f"XYT file not created or is empty after PGM conversion: {xyt_path}")
                raise Exception("XYT file not created or is empty after PGM conversion")
                
        except Exception as pgm_error:
            logger.error(f"PGM conversion/processing failed: {str(pgm_error)}")
            raise Exception(f"Failed to extract minutiae: {str(pgm_error)}")

class Bozorth3Matcher:
    """
    A utility class for matching fingerprint templates using BOZORTH3
    """
    
    @staticmethod
    def _validate_xyt_data(xyt_data, filename="template"):
        # Helper method to validate XYT file content before passing to Bozorth3
        # Ensures each line has 3 or 4 numeric values (x, y, theta, optional quality)
        if not xyt_data:
            logger.warning(f"XYT data for {filename} is empty.")
            return False
        try:
            # Decode if bytes. XYT files are expected to be text-based.
            if isinstance(xyt_data, bytes):
                try:
                    data_to_check = xyt_data.decode('utf-8')
                except UnicodeDecodeError:
                    # Handle encoding issues gracefully - try alternative decoding approaches
                    # Some XYT data might be stored in different encodings or have binary artifacts
                    logger.warning(f"XYT data for {filename} could not be decoded as UTF-8. Attempting alternative decoding methods.")
                    
                    try:
                        # Try latin-1 encoding as a fallback (handles binary data as well)
                        data_to_check = xyt_data.decode('latin-1')
                        logger.info(f"Successfully decoded XYT data for {filename} using latin-1 encoding.")
                    except UnicodeDecodeError:
                        try:
                            # Try ignoring decode errors to extract what we can
                            data_to_check = xyt_data.decode('utf-8', errors='ignore')
                            logger.warning(f"XYT data for {filename} decoded with errors ignored. Some data may be lost.")
                        except Exception:
                            # If all decoding attempts fail, log the issue and return False
                            # This prevents the matching process from crashing due to encoding issues
                            logger.error(f"XYT data for {filename} could not be decoded with any supported encoding. "
                                       "The data is likely corrupted or in an unsupported format. Skipping validation.")
                            return False
            else:
                data_to_check = xyt_data # Assume it's already a string

            lines = data_to_check.strip().split('\n')
            if not lines or (len(lines) == 1 and not lines[0].strip()): # Handle empty or just newline
                logger.warning(f"XYT data for {filename} is effectively empty after stripping.")
                return False

            for i, line in enumerate(lines):
                line = line.strip()
                if not line:  # Skip empty lines if any persist
                    continue
                parts = line.split()
                # Validate that parts are numeric (integers or floats)
                if not (3 <= len(parts) <= 4 and all(p.replace('.', '', 1).lstrip('-').isdigit() for p in parts)):
                    logger.error(f"Malformed line #{i+1} in XYT data for {filename}: '{line}'. Expected 3 or 4 numeric values.")
                    return False
            return True
        except Exception as e:
            # Catch any other unexpected errors during validation
            logger.error(f"Unexpected exception during XYT data validation for {filename}: {str(e)}")
            return False

    @staticmethod
    def match_fingerprint_templates(probe_template, reference_template, threshold=40):
        """
        Match two fingerprint templates using BOZORTH3
        
        Args:
            probe_template: The probe fingerprint template (binary XYT data or base64 string)
            reference_template: The reference fingerprint template (binary XYT data or base64 string)
            threshold: Matching threshold (default: 40)
            
        Returns:
            A dictionary with match_score and is_match flag
        """
        try:
            # Create a temporary directory for processing
            with tempfile.TemporaryDirectory() as temp_dir:
                # Determine if inputs are base64 or binary and decode if necessary
                probe_data = Bozorth3Matcher._ensure_binary_template(probe_template)
                ref_data = Bozorth3Matcher._ensure_binary_template(reference_template)
                
                # Fix any suspicious coordinates in both templates
                probe_data = Bozorth3Matcher.fix_minutiae_coordinates(probe_data)
                ref_data = Bozorth3Matcher.fix_minutiae_coordinates(ref_data)
                
                logger.info(f"DEBUGGING: Probe data type: {type(probe_data)}, size: {len(probe_data)} bytes")
                logger.info(f"DEBUGGING: Reference data type: {type(ref_data)}, size: {len(ref_data)} bytes")
                
                # Log first few bytes to understand the data format
                if isinstance(probe_data, bytes):
                    logger.info(f"DEBUGGING: Probe data first 50 bytes: {probe_data[:50]}")
                else:
                    logger.info(f"DEBUGGING: Probe data first 50 chars: {str(probe_data)[:50]}")
                    
                if isinstance(ref_data, bytes):
                    logger.info(f"DEBUGGING: Reference data first 50 bytes: {ref_data[:50]}")
                else:
                    logger.info(f"DEBUGGING: Reference data first 50 chars: {str(ref_data)[:50]}")
                
                # Validate XYT data before writing to files and calling Bozorth3
                if not Bozorth3Matcher._validate_xyt_data(probe_data, "probe"):
                    logger.error("Probe XYT data is malformed. Skipping Bozorth3 matching.")
                    return {"match_score": 0, "is_match": False, "error": "Malformed probe XYT file"}
                if not Bozorth3Matcher._validate_xyt_data(ref_data, "reference"):
                    logger.error("Reference XYT data is malformed. Skipping Bozorth3 matching.")
                    return {"match_score": 0, "is_match": False, "error": "Malformed reference XYT file"}
                
                logger.info(f"Matching fingerprints: probe template size: {len(probe_data)} bytes, "
                           f"reference template size: {len(ref_data)} bytes")
                
                # Write probe template to file
                probe_path = os.path.join(temp_dir, "probe.xyt")
                with open(probe_path, 'wb') as f:
                    f.write(probe_data)
                
                # Log the contents written to probe file
                with open(probe_path, 'r', encoding='utf-8', errors='ignore') as f:
                    probe_content = f.read()
                    logger.info(f"DEBUGGING: Probe file contents ({len(probe_content)} chars): {probe_content[:200]}...")
                    
                # Write reference template to file
                ref_path = os.path.join(temp_dir, "reference.xyt")
                with open(ref_path, 'wb') as f:
                    f.write(ref_data)
                
                # Log the contents written to reference file
                with open(ref_path, 'r', encoding='utf-8', errors='ignore') as f:
                    ref_content = f.read()
                    logger.info(f"DEBUGGING: Reference file contents ({len(ref_content)} chars): {ref_content[:200]}...")
                
                # Run BOZORTH3 for matching
                cmd = ["bozorth3", "-A", "outfmt=spg", "-T", str(threshold), "-m1", probe_path, ref_path]
                logger.info(f"DEBUGGING: Running Bozorth3 command: {' '.join(cmd)}")
                
                process = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True
                )
                
                logger.info(f"DEBUGGING: Bozorth3 exit code: {process.returncode}")
                logger.info(f"DEBUGGING: Bozorth3 stdout: '{process.stdout.strip()}'")
                logger.info(f"DEBUGGING: Bozorth3 stderr: '{process.stderr.strip()}'")
                
                # Check if the process completed successfully
                if process.returncode != 0:
                    logger.warning(f"BOZORTH3 returned non-zero exit code: {process.returncode}")
                    logger.warning(f"BOZORTH3 stderr: {process.stderr}")
                    # Return a default score of 0 for failed matches
                    return {
                        "match_score": 0,
                        "is_match": False
                    }
                
                # Parse output
                output = process.stdout.strip()
                logger.info(f"BOZORTH3 output: {output}")
                
                # Parse score from output
                if output:
                    score_parts = output.split()
                    if len(score_parts) >= 1:
                        try:
                            match_score = int(score_parts[0])
                            is_match = match_score >= threshold
                            logger.info(f"Matching result: score={match_score}, threshold={threshold}, is_match={is_match}")
                            
                            return {
                                "match_score": match_score,
                                "is_match": is_match
                            }
                        except ValueError:
                            logger.error(f"Failed to parse match score from output: {output}")
                
                # Default return if no score could be parsed
                logger.warning("No match score found, returning default 0 score")
                return {
                    "match_score": 0,
                    "is_match": False
                }
                
        except Exception as e:
            logger.exception(f"Error in Bozorth3Matcher: {str(e)}")
            return {
                "match_score": 0,
                "is_match": False,
                "error": str(e)
            }
    
    @staticmethod
    def _ensure_binary_template(template_data):
        """
        Ensure the template is in binary format, decoding from base64 if necessary
        
        Args:
            template_data: Template data (binary or base64 string)
            
        Returns:
            Binary template data
        """
        # Check if input is already binary
        if isinstance(template_data, bytes):
            logger.info("Template is already in binary format")
            return template_data
            
        # Check if input is a string (possibly base64)
        if isinstance(template_data, str):
            try:
                # Attempt to decode as base64
                logger.info(f"Decoding template from base64 string (length: {len(template_data)})")
                decoded = base64.b64decode(template_data)
                logger.info(f"Successfully decoded base64 to binary (size: {len(decoded)} bytes)")
                return decoded
            except Exception as e:
                logger.error(f"Failed to decode template as base64: {str(e)}")
                # If it's not valid base64, treat it as raw text
                logger.info("Treating template as raw text data")
                return template_data.encode('utf-8')
                
        # For other types, convert to string and then to bytes
        logger.warning(f"Unexpected template data type: {type(template_data)}")
        return str(template_data).encode('utf-8')
    
    @staticmethod
    def identify_fingerprint(probe_template_data, threshold=40, limit=5):
        """
        Search for matching fingerprints in the database
        
        Args:
            probe_template_data: The fingerprint template to search for
            threshold: Minimum score to consider a match
            limit: Maximum number of matches to return
            
        Returns:
            list: Matching fingerprints sorted by match score (highest first)
        """
        from .models import FingerprintTemplate
        
        # Create a temporary file for the probe template
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as probe_file:
            probe_file.write(probe_template_data)
            probe_path = probe_file.name
        
        matches = []
        
        try:
            # Fetch all templates from the database
            # Consider pagination for large databases
            templates = FingerprintTemplate.objects.all()
            
            for template in templates:
                # Create a temporary file for the gallery template
                with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as gallery_file:
                    gallery_file.write(template.xyt_data)
                    gallery_path = gallery_file.name
                
                try:
                    # Run BOZORTH3 for matching
                    result = subprocess.run([
                        'bozorth3',
                        probe_path,
                        gallery_path
                    ], capture_output=True, text=True, check=True)
                    
                    # Parse the match score
                    match_score = int(result.stdout.strip())
                    
                    # If score exceeds threshold, add to matches
                    if match_score >= threshold:
                        matches.append({
                            'national_id': template.national_id,
                            'match_score': match_score,
                            'user_id': template.user_id
                        })
                finally:
                    # Clean up the gallery template file
                    if os.path.exists(gallery_path):
                        os.unlink(gallery_path)
            
            # Sort matches by score (descending) and limit results
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            return matches[:limit]
            
        finally:
            # Clean up the probe template file
            if os.path.exists(probe_path):
                os.unlink(probe_path)
    
    @staticmethod
    def fix_minutiae_coordinates(xyt_data):
        """
        Fix suspicious coordinates in XYT data before matching
        
        Args:
            xyt_data: XYT data as a string or bytes
            
        Returns:
            Bytes containing the fixed XYT data
        """
        if not xyt_data:
            return xyt_data
            
        # Convert to string if bytes
        if isinstance(xyt_data, bytes):
            try:
                data_str = xyt_data.decode('utf-8')
            except UnicodeDecodeError:
                # If we can't decode as UTF-8, try with latin-1
                try:
                    data_str = xyt_data.decode('latin-1')
                except:
                    # If all else fails, return as is
                    logger.warning("Could not decode XYT data for fixing coordinates")
                    return xyt_data
        else:
            data_str = xyt_data
            
        # Process each line to fix coordinates
        fixed_lines = []
        lines = data_str.strip().split('\n')
        
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 3:
                try:
                    x = int(float(parts[0]))
                    y = int(float(parts[1]))
                    theta = int(float(parts[2]))
                    
                    # Extract only the proper 14 bits for coordinates
                    fixed_x = x & 0x3FFF  # Keep only lowest 14 bits
                    fixed_y = y & 0x3FFF  # Keep only lowest 14 bits
                    
                    # Ensure coordinates are within valid range (0-499)
                    fixed_x = min(499, fixed_x)
                    fixed_y = min(499, fixed_y)
                    
                    # Rebuild the line with fixed coordinates
                    fixed_lines.append(f"{fixed_x} {fixed_y} {theta}")
                except (ValueError, IndexError):
                    # If we can't parse the line, keep it as is
                    fixed_lines.append(line)
            else:
                # Keep lines with unexpected format as they are
                fixed_lines.append(line)
                
        # Join the fixed lines back into a string
        fixed_data = '\n'.join(fixed_lines)
        
        # Log the fix
        original_coords = [int(line.split()[0]) for line in lines if len(line.split()) >= 3]
        fixed_coords = [int(line.split()[0]) for line in fixed_lines if len(line.split()) >= 3]
        
        if original_coords and fixed_coords:
            orig_min_x = min(original_coords)
            orig_max_x = max(original_coords)
            fixed_min_x = min(fixed_coords)
            fixed_max_x = max(fixed_coords)
            
            if orig_min_x != fixed_min_x or orig_max_x != fixed_max_x:
                logger.info(f"Fixed XYT coordinates: reduced X range from {orig_min_x}-{orig_max_x} to {fixed_min_x}-{fixed_max_x}")
                
        # Return as bytes
        return fixed_data.encode('utf-8')
