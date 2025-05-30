import os
import tempfile
import subprocess
import logging
import shutil

logger = logging.getLogger(__name__)

class Bozorth3Matcher:
    """Wrapper for NIST's BOZORTH3 fingerprint matching algorithm"""
    
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
            # Create temporary files for templates
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as probe_file:
                probe_file.write(probe_template_data)
                probe_path = probe_file.name
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xyt') as gallery_file:
                gallery_file.write(gallery_template_data)
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
