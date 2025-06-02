import os
import tempfile
import subprocess
import logging
import shutil
import numpy as np
import cv2
import io
import PIL.Image

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
    # Read image from bytes
    img = PIL.Image.open(io.BytesIO(image_data)).convert('L')  # Grayscale
    img = img.resize((500, 500), PIL.Image.BILINEAR)
    img_np = np.array(img)
    # Histogram equalization
    img_eq = cv2.equalizeHist(img_np)
    # Save back to PNG bytes
    _, buf = cv2.imencode('.png', img_eq)
    return buf.tobytes()

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
    
    try:
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
            return xyt_data
        else:
            raise Exception("XYT file not created or is empty")
            
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        logger.error(f"mindtct error (exit code {e.returncode}): {error_msg}")
        
        # Try with PGM format
        try:
            pgm_path = os.path.join(output_dir, "probe.pgm")
            logger.info("Trying alternative format conversion for fingerprint")
            
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
            logger.info("Successfully processed fingerprint with PGM format")
            
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

class Bozorth3Matcher:
    """Wrapper for NIST's BOZORTH3 fingerprint matching algorithm"""
    
    @staticmethod
    def ensure_xyt_format(template_data):
        """
        Ensure template is in XYT format. Convert from ISO format if needed.
        
        Args:
            template_data: Template data in either XYT or ISO format
            
        Returns:
            Template data in XYT format
        """
        # Check if this is an ISO template (starts with "FMR")
        if isinstance(template_data, bytes) and len(template_data) > 32 and template_data[:3] == b'FMR':
            logger.info("Converting ISO template to XYT format")
            # Create a temporary directory
            with tempfile.TemporaryDirectory() as work_dir:
                xyt_file_path = os.path.join(work_dir, "template.xyt")
                with open(xyt_file_path, 'w') as f:
                    # Extract minutiae from ISO template (each minutia is 6 bytes)
                    # Skip the 32-byte header
                    offset = 32
                    minutiae_count = template_data[offset-1]  # Get minutiae count from header
                    logger.info(f"ISO template has {minutiae_count} minutiae points")
                    
                    # Extract minutiae from ISO template (each minutia is 6 bytes)
                    for i in range(minutiae_count):
                        idx = offset + (i * 6)
                        if idx + 6 <= len(template_data):
                            # Extract x, y, and theta from the ISO format
                            x_high = template_data[idx] & 0x7F
                            x_low = template_data[idx+1]
                            x = (x_high << 8) | x_low
                            
                            y_high = template_data[idx+2] & 0x7F
                            y_low = template_data[idx+3]
                            y = (y_high << 8) | y_low
                            
                            theta = template_data[idx+4]
                            
                            # Write in MINDTCT XYT format
                            f.write(f"{x} {y} {theta}\n")
                
                # Read back the XYT file
                with open(xyt_file_path, 'rb') as f:
                    xyt_data = f.read()
                
                logger.info("Successfully converted ISO template to XYT format")
                return xyt_data
        
        # Already in XYT format or can't determine - return as is
        return template_data
    
    @staticmethod
    def match_fingerprint_templates(probe_template_data, gallery_template_data, threshold=40):
        """
        Match two fingerprint templates using BOZORTH3
        
        Args:
            probe_template_data: Binary XYT template data of the probe fingerprint
            gallery_template_data: Binary XYT template data of the gallery fingerprint
            threshold: Match score threshold (default: 40)
            
        Returns:
            dict: Contains match_score and is_match boolean
        """
        try:
            # Ensure templates are in XYT format
            probe_xyt = Bozorth3Matcher.ensure_xyt_format(probe_template_data)
            gallery_xyt = Bozorth3Matcher.ensure_xyt_format(gallery_template_data)
            
            # Create temporary files for templates
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as probe_file:
                probe_file.write(probe_xyt)
                probe_path = probe_file.name
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as gallery_file:
                gallery_file.write(gallery_xyt)
                gallery_path = gallery_file.name
            
            # Run BOZORTH3 to match the templates
            logger.info(f"Running BOZORTH3 with threshold {threshold}")
            result = subprocess.run([
                'bozorth3',
                probe_path,
                gallery_path
            ], capture_output=True, text=True, check=True)
            
            # Parse the match score
            match_score = int(result.stdout.strip())
            logger.info(f"Match score: {match_score}")
            
            return {
                'match_score': match_score,
                'is_match': match_score >= threshold
            }
            
        except Exception as e:
            logger.error(f"Error matching fingerprints: {str(e)}")
            raise
        finally:
            # Clean up temporary files
            if 'probe_path' in locals() and os.path.exists(probe_path):
                os.unlink(probe_path)
            if 'gallery_path' in locals() and os.path.exists(gallery_path):
                os.unlink(gallery_path)
    
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
