import os
import numpy as np
import logging
import subprocess
from scipy.stats import iqr
from typing import List, Tuple, Optional, Dict
import base64
import hashlib
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)

# Constants for fingerprint image dimensions and processing
IMAGE_WIDTH = 500
IMAGE_HEIGHT = 550
IMAGE_DPI = 96
MAX_MINUTIAE = 40  # Maximum number of minutiae points to use for matching
CENTER_X = IMAGE_WIDTH // 2
CENTER_Y = IMAGE_HEIGHT // 2

class FingerprintProcessor:
    @staticmethod
    def extract_minutiae(image_path: str, output_dir: str) -> bytes:
        """
        Extract minutiae from fingerprint image using MINDTCT.
        Assumes input image is already grayscale, 8-bit depth.
        
        Args:
            image_path: Path to the fingerprint image file
            output_dir: Directory to store the output files
            
        Returns:
            Binary XYT template data
        """
        output_basename = os.path.join(output_dir, "probe")
        logger.info(f"Extracting minutiae from image: {os.path.basename(image_path)}")
        
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
                
                minutiae_count = xyt_data.count(b'\n') + 1
                logger.info(f"Extracted {minutiae_count} minutiae points from fingerprint")
                return xyt_data
            else:
                logger.error(f"XYT file not created or is empty: {xyt_path}")
                raise Exception("XYT file not created or is empty")
                
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            logger.error(f"mindtct error (exit code {e.returncode}): {error_msg}")
            raise Exception(f"Failed to extract minutiae: {error_msg}")

    @staticmethod
    def _preserve_angle_diversity(angles: np.ndarray, original_angles: np.ndarray) -> np.ndarray:
        """
        Preserve angle diversity by ensuring even distribution across the full 0-180° range.
        
        Args:
            angles: Current angles array
            original_angles: Original angles for reference
            
        Returns:
            Redistributed angles with better diversity across full range
        """
        # Define angle bins (8 bins of 22.5° each for 0-180° range)
        num_bins = 8
        bin_size = 180 / num_bins  # 22.5° per bin
        
        # Ensure angles are in 0-180° range
        angles = angles % 180
        
        # Count angles in each bin
        angle_bins = np.floor(angles / bin_size).astype(int)
        angle_bins = np.clip(angle_bins, 0, num_bins - 1)
        
        # Calculate target count per bin for even distribution
        total_angles = len(angles)
        target_per_bin = max(1, total_angles // num_bins)
        
        # Redistribute angles to achieve better distribution
        redistributed_angles = angles.copy()
        
        # First pass: identify overcrowded bins
        bin_counts = np.bincount(angle_bins, minlength=num_bins)
        
        for bin_idx in range(num_bins):
            bin_count = bin_counts[bin_idx]
            
            if bin_count > target_per_bin * 1.5:  # If bin is significantly overcrowded
                # Get indices of angles in this bin
                bin_mask = angle_bins == bin_idx
                bin_indices = np.where(bin_mask)[0]
                
                # Keep the most central angles in this bin
                bin_angles = angles[bin_indices]
                bin_center = (bin_idx + 0.5) * bin_size
                distances_from_center = np.abs(bin_angles - bin_center)
                
                # Sort by distance from bin center
                sorted_indices = bin_indices[np.argsort(distances_from_center)]
                
                # Keep target_per_bin angles, redistribute the rest
                redistribute_indices = sorted_indices[target_per_bin:]
                
                # Redistribute excess angles to less populated bins across the full range
                for i, idx in enumerate(redistribute_indices):
                    # Find the least populated bin across the entire range
                    least_populated_bin = np.argmin(bin_counts)
                    
                    # If all bins are equally populated, distribute cyclically
                    if bin_counts[least_populated_bin] >= target_per_bin:
                        target_bin = (bin_idx + (i % num_bins)) % num_bins
                    else:
                        target_bin = least_populated_bin
                    
                    # Move angle to target bin
                    target_angle = (target_bin + 0.5) * bin_size
                    # Add small variation to avoid exact clustering
                    variation = (i % 5 - 2) * 2  # -4, -2, 0, +2, +4 degree variation
                    new_angle = (target_angle + variation) % 180
                    
                    redistributed_angles[idx] = new_angle
                    angle_bins[idx] = target_bin
                    
                    # Update bin counts
                    bin_counts[bin_idx] -= 1
                    bin_counts[target_bin] += 1
        
        # Second pass: ensure we have representation in all bins
        empty_bins = np.where(bin_counts == 0)[0]
        if len(empty_bins) > 0:
            # Find bins with excess minutiae to redistribute
            excess_bins = np.where(bin_counts > target_per_bin)[0]
            
            for empty_bin in empty_bins:
                if len(excess_bins) > 0:
                    # Take one minutia from the most populated excess bin
                    source_bin = excess_bins[np.argmax(bin_counts[excess_bins])]
                    source_mask = angle_bins == source_bin
                    source_indices = np.where(source_mask)[0]
                    
                    if len(source_indices) > 0:
                        # Move one minutia to the empty bin
                        move_idx = source_indices[0]
                        target_angle = (empty_bin + 0.5) * bin_size
                        redistributed_angles[move_idx] = target_angle
                        angle_bins[move_idx] = empty_bin
                        
                        # Update counts
                        bin_counts[source_bin] -= 1
                        bin_counts[empty_bin] += 1
        
        return redistributed_angles

    @staticmethod
    def canonicalize_minutiae(minutiae: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
        """
        Canonicalize minutiae using IQR-based orientation estimation with improved angle distribution.
        Aligns the principal axis of the fingerprint using the interquartile range.
        
        Args:
            minutiae: List of (x, y, theta) tuples
            
        Returns:
            List of canonicalized (x, y, theta) tuples
        """
        if not minutiae:
            return []
            
        # Convert to numpy array for easier manipulation
        points = np.array(minutiae, dtype=np.float64)
        
        # Store original angles for diversity preservation and ensure full range
        original_angles = points[:, 2].copy() % 180  # Ensure 0-180° range
        
        # Center the points around (0,0) for rotation
        center_x = np.mean(points[:, 0])
        center_y = np.mean(points[:, 1])
        points[:, 0] -= center_x
        points[:, 1] -= center_y
        
        # Calculate IQR for x and y coordinates
        x_coords = points[:, 0]
        y_coords = points[:, 1]
        x_q1, x_q3 = np.percentile(x_coords, [25, 75])
        y_q1, y_q3 = np.percentile(y_coords, [25, 75])
        x_iqr = max(x_q3 - x_q1, 1.0)  # Avoid division by zero
        y_iqr = max(y_q3 - y_q1, 1.0)  # Avoid division by zero
        
        # Weight coordinates by their IQR for better orientation estimation
        weighted_coords = np.vstack([x_coords / x_iqr, y_coords / y_iqr])
        
        try:
            # Calculate covariance matrix and get principal axis
            cov_matrix = np.cov(weighted_coords)
            eigvals, eigvecs = np.linalg.eigh(cov_matrix)
            
            # Get rotation angle from principal axis
            principal_vec = eigvecs[:, np.argmax(np.abs(eigvals))]
            angle = np.degrees(np.arctan2(principal_vec[1], principal_vec[0]))
            
            # Normalize angle to be between -90 and 90 degrees
            if angle > 90:
                angle -= 180
            elif angle < -90:
                angle += 180
            
            # Create rotation matrix
            theta = np.radians(angle)
            rotation_matrix = np.array([
                [np.cos(theta), -np.sin(theta)],
                [np.sin(theta), np.cos(theta)]
            ])
            
            # Rotate coordinates
            rotated_coords = np.dot(points[:, :2], rotation_matrix.T)
            
            # Shift back to image center and clip to bounds
            points[:, 0] = np.clip(rotated_coords[:, 0] + CENTER_X, 0, IMAGE_WIDTH - 1)
            points[:, 1] = np.clip(rotated_coords[:, 1] + CENTER_Y, 0, IMAGE_HEIGHT - 1)
            
            # IMPROVED ANGLE PROCESSING - preserve full 0-180° range
            # Rotate angles by the same amount as coordinates
            angles_rad = np.radians(points[:, 2])
            rotated_angles_rad = angles_rad + theta
            rotated_angles = (np.degrees(rotated_angles_rad) + 360) % 180
            
            # Apply angle diversity preservation across full range
            points[:, 2] = FingerprintProcessor._preserve_angle_diversity(rotated_angles, original_angles)
            
        except (np.linalg.LinAlgError, ValueError) as e:
            logger.warning(f"Error in canonicalization: {e}. Using original coordinates.")
            # If rotation fails, just center and clip the points
            points[:, 0] = np.clip(points[:, 0] + CENTER_X, 0, IMAGE_WIDTH - 1)
            points[:, 1] = np.clip(points[:, 1] + CENTER_Y, 0, IMAGE_HEIGHT - 1)
            # Preserve original angle diversity across full range
            points[:, 2] = points[:, 2] % 180  # Ensure 0-180° range
            points[:, 2] = FingerprintProcessor._preserve_angle_diversity(points[:, 2], original_angles)
        
        return [tuple(map(int, point)) for point in points]

    @staticmethod
    def quantize_minutiae(minutiae: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
        """
        Quantize minutiae coordinates and angles with deterministic angle distribution.
        
        Args:
            minutiae: List of (x, y, theta) tuples
            
        Returns:
            List of quantized (x, y, theta) tuples
        """
        if not minutiae:
            return []
        
        quantized = []
        for i, (x, y, theta) in enumerate(minutiae):
            # Ensure coordinates are within bounds
            x = max(0, min(x, IMAGE_WIDTH - 1))
            y = max(0, min(y, IMAGE_HEIGHT - 1))
            
            # Quantize coordinates to 8-pixel grid
            qx = int(round(x / 8.0) * 8)
            qy = int(round(y / 8.0) * 8)
            
            # IMPROVED ANGLE QUANTIZATION
            # Use deterministic offset based on position to avoid clustering
            position_hash = (x * 31 + y * 17) % 100  # Deterministic pseudo-random
            offset = (position_hash / 100.0 - 0.5) * 4  # -2 to +2 degree range
            
            # Quantize angle to 10° intervals with position-based offset
            qtheta = ((theta + offset + 5) // 10 * 10) % 180
            
            quantized.append((qx, qy, int(qtheta)))
        
        return quantized

    @staticmethod
    def optimize_minutiae(minutiae: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
        """
        Optimize minutiae by selecting diverse and reliable points.
        
        Args:
            minutiae: List of (x, y, theta) tuples
            
        Returns:
            List of optimized (x, y, theta) tuples
        """
        if not minutiae:
            return []
        
        # Calculate center of mass
        center_x = sum(x for x, _, _ in minutiae) / len(minutiae)
        center_y = sum(y for _, y, _ in minutiae) / len(minutiae)
        
        # IMPROVED SELECTION STRATEGY
        # Balance between central reliability and angle diversity
        
        # Group minutiae by angle bins for diversity
        angle_bins = {}
        bin_size = 20  # 20-degree bins for diversity
        
        for minutia in minutiae:
            x, y, theta = minutia
            bin_idx = int(theta // bin_size)
            if bin_idx not in angle_bins:
                angle_bins[bin_idx] = []
            
            # Calculate reliability score (closer to center = more reliable)
            distance_from_center = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            max_distance = ((IMAGE_WIDTH/2) ** 2 + (IMAGE_HEIGHT/2) ** 2) ** 0.5
            reliability = 1.0 - (distance_from_center / max_distance)
            
            angle_bins[bin_idx].append((minutia, reliability))
        
        # Select minutiae ensuring angle diversity
        selected_minutiae = []
        target_per_bin = max(1, MAX_MINUTIAE // len(angle_bins))
        
        # First pass: select most reliable from each bin
        for bin_idx, bin_minutiae in angle_bins.items():
            # Sort by reliability (higher is better)
            bin_minutiae.sort(key=lambda x: x[1], reverse=True)
            
            # Take up to target_per_bin from this bin
            for minutia, reliability in bin_minutiae[:target_per_bin]:
                if len(selected_minutiae) < MAX_MINUTIAE:
                    selected_minutiae.append(minutia)
        
        # Second pass: fill remaining slots with most reliable overall
        if len(selected_minutiae) < MAX_MINUTIAE:
            all_remaining = []
            for bin_minutiae in angle_bins.values():
                for minutia, reliability in bin_minutiae[target_per_bin:]:
                    all_remaining.append((minutia, reliability))
            
            # Sort by reliability and take the best
            all_remaining.sort(key=lambda x: x[1], reverse=True)
            remaining_slots = MAX_MINUTIAE - len(selected_minutiae)
            
            for minutia, reliability in all_remaining[:remaining_slots]:
                selected_minutiae.append(minutia)
        
        return selected_minutiae[:MAX_MINUTIAE]

    @staticmethod
    def parse_xyt_data(xyt_data: bytes) -> List[Tuple[int, int, int]]:
        """
        Parse XYT data into minutiae list.
        
        Args:
            xyt_data: XYT data as bytes
            
        Returns:
            List of (x, y, theta) tuples
        """
        minutiae = []
        text = xyt_data.decode('utf-8')
        
        for line in text.strip().split('\n'):
            if line.strip():
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        x = int(float(parts[0]))
                        y = int(float(parts[1]))
                        theta = int(float(parts[2])) % 180
                        
                        # Ensure coordinates are within bounds
                        x = max(0, min(x, IMAGE_WIDTH - 1))
                        y = max(0, min(y, IMAGE_HEIGHT - 1))
                        
                        minutiae.append((x, y, theta))
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Error parsing minutia line '{line}': {e}")
        
        return minutiae

    @staticmethod
    def format_xyt_data(minutiae: List[Tuple[int, int, int]]) -> bytes:
        """
        Format minutiae as XYT data.
        
        Args:
            minutiae: List of (x, y, theta) tuples
            
        Returns:
            XYT data as bytes
        """
        lines = []
        for x, y, theta in minutiae:
            # Ensure coordinates and angles are within bounds
            x = max(0, min(x, IMAGE_WIDTH - 1))
            y = max(0, min(y, IMAGE_HEIGHT - 1))
            theta = theta % 180
            lines.append(f"{x} {y} {theta}")
        return '\n'.join(lines).encode('utf-8')

    @staticmethod
    def generate_iso_template(minutiae: List[Tuple[int, int, int]]) -> bytes:
        """
        Generate an ISO/IEC 19794-2 compliant fingerprint template.
        
        Args:
            minutiae: List of (x, y, theta) tuples
            
        Returns:
            ISO template as bytes
        """
        # ISO/IEC 19794-2 header (32 bytes)
        header = bytearray(32)
        
        # Format identifier ('FMR\0')
        header[0:4] = b'FMR\0'
        
        # Version (2.0)
        header[4:8] = bytes([0x20, 0x00, 0x00, 0x00])
        
        # Total record length (header + minutiae data)
        total_length = 32 + len(minutiae) * 6  # 6 bytes per minutia
        header[8:12] = total_length.to_bytes(4, 'little')
        
        # Capture device ID (vendor=0x00, type=0x00)
        header[12:14] = bytes([0x00, 0x00])
        
        # Image size (500x550)
        header[16:18] = IMAGE_WIDTH.to_bytes(2, 'little')
        header[18:20] = IMAGE_HEIGHT.to_bytes(2, 'little')
        
        # Resolution (96x96 DPI)
        header[24:26] = IMAGE_DPI.to_bytes(2, 'little')
        header[26:28] = IMAGE_DPI.to_bytes(2, 'little')
        
        # Number of minutiae
        header[31] = min(len(minutiae), MAX_MINUTIAE)
        
        # Create minutiae data
        minutiae_data = bytearray()
        for x, y, theta in minutiae[:MAX_MINUTIAE]:
            # X coordinate (14 bits)
            x_bytes = (x & 0x3FFF).to_bytes(2, 'little')
            minutiae_data.extend(x_bytes)
            
            # Y coordinate (14 bits)
            y_bytes = (y & 0x3FFF).to_bytes(2, 'little')
            minutiae_data.extend(y_bytes)
            
            # Angle (8 bits)
            minutiae_data.append(theta % 180)
            
            # Quality (not used)
            minutiae_data.append(0x00)
        
        return bytes(header + minutiae_data)

    @staticmethod
    def parse_iso_template(iso_data: bytes) -> List[Tuple[int, int, int]]:
        """
        Parse an ISO/IEC 19794-2 fingerprint template.
        
        Args:
            iso_data: ISO template data as bytes
            
        Returns:
            List of (x, y, theta) tuples
        """
        if len(iso_data) < 32:
            logger.error("Invalid ISO template: too short")
            return []
            
        # Parse header
        if iso_data[:3] != b'FMR':
            logger.error("Invalid ISO template: wrong format identifier")
            return []
            
        minutiae_count = iso_data[31]
        if minutiae_count > MAX_MINUTIAE:
            logger.warning(f"Template contains {minutiae_count} minutiae, limiting to {MAX_MINUTIAE}")
            minutiae_count = MAX_MINUTIAE
        
        # Parse minutiae data
        minutiae = []
        offset = 32  # Skip header
        
        for i in range(minutiae_count):
            if offset + 6 > len(iso_data):
                break
                
            # Extract X coordinate (14 bits)
            x = int.from_bytes(iso_data[offset:offset+2], 'little') & 0x3FFF
            
            # Extract Y coordinate (14 bits)
            y = int.from_bytes(iso_data[offset+2:offset+4], 'little') & 0x3FFF
            
            # Extract angle (8 bits)
            theta = iso_data[offset+4] % 180
            
            # Skip quality byte
            offset += 6
            
            # Ensure coordinates are within bounds
            x = min(max(x, 0), IMAGE_WIDTH - 1)
            y = min(max(y, 0), IMAGE_HEIGHT - 1)
            
            minutiae.append((x, y, theta))
        
        return minutiae

    @staticmethod
    def calculate_circular_mean(angles):
        """Calculate proper circular mean of angles in degrees."""
        sin_sum = np.sum(np.sin(np.radians(angles)))
        cos_sum = np.sum(np.cos(np.radians(angles)))
        return int(np.degrees(np.arctan2(sin_sum, cos_sum)) % 360)

    @staticmethod
    def generate_template_hash(minutiae):
        """Generate a stable hash for a set of minutiae points."""
        if not minutiae:
            return None
        
        # Sort minutiae for stable hash
        sorted_minutiae = sorted(minutiae, key=lambda m: (m[0], m[1], m[2]))
        
        # Convert to bytes for hashing
        minutiae_bytes = b''
        for x, y, theta in sorted_minutiae:
            minutiae_bytes += x.to_bytes(2, 'little')
            minutiae_bytes += y.to_bytes(2, 'little')
            minutiae_bytes += theta.to_bytes(1, 'little')
        
        return hashlib.sha256(minutiae_bytes).hexdigest()

    @staticmethod
    def fuse_minutiae_points(xyt_paths):
        """Fuse minutiae points from multiple templates using DBSCAN clustering."""
        all_minutiae = []
        
        # Collect all minutiae points
        for xyt_path in xyt_paths:
            with open(xyt_path, 'r') as f:
                for line in f:
                    if line.strip():
                        x, y, theta = map(int, line.split())
                        all_minutiae.append([x, y, theta])
        
        if not all_minutiae:
            return []
        
        # Convert to numpy array
        minutiae_array = np.array(all_minutiae)
        
        # Cluster minutiae points using DBSCAN
        coords = minutiae_array[:, :2]  # Only use x,y coordinates for clustering
        clustering = DBSCAN(eps=10, min_samples=2).fit(coords)
        
        # Process each cluster
        fused_minutiae = []
        unique_clusters = set(clustering.labels_)
        
        for cluster_id in unique_clusters:
            if cluster_id == -1:  # Skip noise points
                continue
                
            # Get points in this cluster
            cluster_mask = clustering.labels_ == cluster_id
            cluster_points = minutiae_array[cluster_mask]
            
            # Calculate mean position
            mean_x = int(np.mean(cluster_points[:, 0]))
            mean_y = int(np.mean(cluster_points[:, 1]))
            
            # Calculate circular mean of angles
            mean_theta = FingerprintProcessor.calculate_circular_mean(cluster_points[:, 2])
            
            fused_minutiae.append((mean_x, mean_y, mean_theta))
        
        # Add non-clustered points
        noise_mask = clustering.labels_ == -1
        noise_points = minutiae_array[noise_mask]
        for point in noise_points:
            fused_minutiae.append(tuple(map(int, point)))
        
        return fused_minutiae

    def process_fingerprint(self, fingerprint_data: bytes) -> Dict[str, str]:
        """
        Process a fingerprint image and return both ISO and XYT templates.
        
        Args:
            fingerprint_data: Raw fingerprint image data
            
        Returns:
            Dictionary containing base64-encoded ISO and XYT templates
        """
        try:
            # Extract minutiae using MINDTCT
            minutiae = self._extract_minutiae(fingerprint_data)
            if not minutiae:
                raise ValueError("No minutiae found in fingerprint")
            
            # Canonicalize and quantize minutiae
            processed_minutiae = self.canonicalize_minutiae(minutiae)
            quantized_minutiae = self.quantize_minutiae(processed_minutiae)
            
            # Generate ISO template
            iso_template = self.generate_iso_template(quantized_minutiae)
            
            # Generate XYT template
            xyt_template = self.generate_xyt_template(quantized_minutiae)
            
            return {
                'iso_template_base64': base64.b64encode(iso_template).decode('utf-8'),
                'xyt_template_base64': base64.b64encode(xyt_template).decode('utf-8')
            }
            
        except Exception as e:
            logger.error(f"Error processing fingerprint: {e}")
            raise 