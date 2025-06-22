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
from PIL import Image
from io import BytesIO

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
    Normalize image data to ensure consistent format.
    Handles both raw image data bytes and base64-encoded strings.
    
    Args:
        image_data: Raw image data bytes or base64-encoded string
        
    Returns:
        Normalized image data bytes
    """
    try:
        # Check if input is a base64-encoded string
        if isinstance(image_data, str):
            # Remove any potential data URL prefix
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            
            try:
                # Decode base64 to bytes
                image_data = base64.b64decode(image_data)
                logger.info(f"Successfully decoded base64 string to image data: {len(image_data)} bytes")
            except Exception as e:
                logger.error(f"Failed to decode base64 string: {str(e)}")
                raise
        
        # Open image from bytes
        with Image.open(BytesIO(image_data)) as img:
            # Convert to RGB mode if needed (some PNG files might be in RGBA)
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            elif img.mode != 'RGB' and img.mode != 'L':
                # Convert any other mode to RGB
                img = img.convert('RGB')
            
            # Resize to standard dimensions if needed
            if img.size != (500, 550):
                logger.info(f"Resizing image from {img.size} to (500, 550)")
                img = img.resize((500, 550), Image.Resampling.LANCZOS)
            
            # Convert to grayscale if not already
            if img.mode != 'L':
                img = img.convert('L')
                logger.info("Converted image to grayscale (8-bit)")
            
            # Save normalized image
            output = BytesIO()
            img.save(output, format='PNG')
            normalized_data = output.getvalue()
            logger.info(f"Normalized image size: {len(normalized_data)} bytes")
            return normalized_data
            
    except Exception as e:
        logger.error(f"Error normalizing image: {str(e)}")
        raise

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
    
    # First, check if the image file actually exists and is readable
    if not os.path.isfile(image_path):
        logger.error(f"Image file does not exist: {image_path}")
        raise FileNotFoundError(f"Image file does not exist: {image_path}")
    
    if os.path.getsize(image_path) == 0:
        logger.error(f"Image file is empty: {image_path}")
        raise ValueError(f"Image file is empty: {image_path}")
        
    # Verify the image is readable by PIL before proceeding
    try:
        with Image.open(image_path) as img:
            img_width, img_height = img.size
            img_mode = img.mode
            logger.info(f"Image successfully read: size={img_width}x{img_height}, mode={img_mode}")
    except Exception as e:
        logger.error(f"Failed to read image with PIL: {str(e)}")
        raise ValueError(f"Invalid image file: {str(e)}")
    
    # Create a backup of the image for debugging
    debug_img_path = os.path.join(output_dir, "debug_input_image.png")
    try:
        shutil.copy(image_path, debug_img_path)
        logger.info(f"Created backup of input image at {debug_img_path}")
    except Exception as e:
        logger.warning(f"Could not create backup of input image: {str(e)}")
    
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
            # Read the XYT file, apply clamping, and write it back
            with open(xyt_path, 'r') as f:
                lines = f.readlines()
            
            # Process each line to clamp values > 499 to 499
            modified_lines = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 3:
                    try:
                        x = int(float(parts[0]))
                        y = int(float(parts[1]))
                        theta = int(float(parts[2]))
                        
                        # Clamp X, Y, and T values to a maximum of 499
                        clamped_x = min(499, x)
                        clamped_y = min(499, y)
                        clamped_theta = min(499, theta)
                        
                        if x != clamped_x or y != clamped_y or theta != clamped_theta:
                            logger.info(f"Clamped minutiae values: ({x},{y},{theta}) -> ({clamped_x},{clamped_y},{clamped_theta})")
                        
                        # Add the clamped line
                        modified_lines.append(f"{clamped_x} {clamped_y} {clamped_theta}\n")
                    except (ValueError, IndexError):
                        # If we can't parse the line, keep it as is
                        modified_lines.append(line)
                else:
                    # Keep lines with unexpected format as they are
                    modified_lines.append(line)
            
            # Write the modified lines back to the file
            with open(xyt_path, 'w') as f:
                f.writelines(modified_lines)
                
            # Now read the file as binary data for return
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
                # Read the XYT file, apply clamping, and write it back
                with open(xyt_path, 'r') as f:
                    lines = f.readlines()
                
                # Process each line to clamp values > 499 to 499
                modified_lines = []
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 3:
                        try:
                            x = int(float(parts[0]))
                            y = int(float(parts[1]))
                            theta = int(float(parts[2]))
                            
                            # Clamp X, Y, and T values to a maximum of 499
                            clamped_x = min(499, x)
                            clamped_y = min(499, y)
                            clamped_theta = min(499, theta)
                            
                            if x != clamped_x or y != clamped_y or theta != clamped_theta:
                                logger.info(f"Clamped minutiae values: ({x},{y},{theta}) -> ({clamped_x},{clamped_y},{clamped_theta})")
                            
                            # Add the clamped line
                            modified_lines.append(f"{clamped_x} {clamped_y} {clamped_theta}\n")
                        except (ValueError, IndexError):
                            # If we can't parse the line, keep it as is
                            modified_lines.append(line)
                    else:
                        # Keep lines with unexpected format as they are
                        modified_lines.append(line)
                
                # Write the modified lines back to the file
                with open(xyt_path, 'w') as f:
                    f.writelines(modified_lines)
                    
                # Now read the file as binary data for return
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
                
                # Use original non-transformed minutiae
                logger.info("Using original non-transformed minutiae coordinates")
                
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
 
