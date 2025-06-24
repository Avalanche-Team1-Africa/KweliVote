# KweliVote Fingerprint API Endpoints

This document provides a comprehensive overview of the fingerprint-related API endpoints in the KweliVote backend system.

## Base URL Structure

All fingerprint-related endpoints are served under the URL pattern:
```
/api/fingerprints/
```

## 1. Process Fingerprint Template Endpoint

**URL:** `/api/fingerprints/process-fingerprint-template/`  
**HTTP Method:** POST  
**View Class:** `ProcessFingerprintTemplateView`  
**Authentication:** Required (IsAuthenticated permission class)

**Purpose:**
- Processes fingerprint images and generates ISO/IEC 19794-2 compliant templates
- Used primarily during voter registration or template creation

**Input Parameters:**
- `fingerprints`: List of fingerprint images (multipart/form-data)

**Response:**
```json
{
  "iso_template_base64": "base64-encoded-iso-template-data",
  "xyt_data": "base64-encoded-xyt-data",
  "metadata": {
    "template_version": "2.0",
    "creation_method": "enrollment",
    "minutiae_count": 40,
    "template_hash": "sha256-hash-of-template"
  }
}
```

**Processing Flow:**
1. Accepts multiple fingerprint images
2. Extracts minutiae from each image using MINDTCT
3. Fuses minutiae points using DBSCAN clustering
4. Applies canonicalization, quantization, and optimization to minutiae
5. Generates ISO template with a consistent format
6. Returns base64-encoded template data

## 2. Verify Fingerprint Endpoint

**URL:** `/api/fingerprints/verify-fingerprint/`  
**HTTP Method:** POST  
**View Class:** `VerifyFingerprintView`  
**Authentication:** Required (IsAuthenticated permission class)

**Purpose:**
- Verifies a fingerprint against a stored template for a specific national ID
- Used during voter authentication or identity verification

**Input Parameters:**
- `nationalId`: National ID of the person to verify (required)
- `fingerprints`: Array of fingerprint samples (required)
  - Each sample can contain:
    - `sample`: The fingerprint data (image or template)
    - `finger`: Identifier for the finger (e.g., "Scan 1")
    - `type`: Type of sample ("template" or "image")
- `template`: Optional base64-encoded template to match against
- `threshold`: Matching threshold score (default: 40)
- `extract_only`: Boolean flag to only extract template without matching

**Request Example (Template-based verification):**
```json
{
  "nationalId": "1234567890",
  "fingerprints": [{
    "sample": "base64-encoded-template-data",
    "type": "template",
    "finger": "Scan 1"
  }],
  "threshold": 40
}
```

**Request Example (Image-based verification):**
```json
{
  "nationalId": "1234567890",
  "fingerprints": [{
    "sample": "base64-encoded-image-data",
    "finger": "Scan 1"
  }],
  "extract_only": true,
  "threshold": 40
}
```

**Response (extract_only=false):**
```json
{
  "national_id": "1234567890",
  "match_score": 75,
  "is_match": true,
  "verification_template_hash": "sha256-hash-of-template",
  "did": "did:kwelivote:1234567890abcdef"
}
```

**Response (extract_only=true):**
```json
{
  "extracted_template": {
    "processing_status": "extracted",
    "iso_template_base64": "base64-encoded-iso-template",
    "xyt_data": "base64-encoded-xyt-data",
    "national_id": "1234567890",
    "metadata": {
      "template_version": "1.0",
      "creation_method": "verification-fusion-stabilization",
      "minutiae_count": 40,
      "template_hash": "sha256-hash-of-template"
    }
  }
}
```

**Processing Flow:**
1. Validates request data
2. Processes provided fingerprint data (either template or image)
3. If image, extracts minutiae and generates verification template
4. Retrieves stored template either from provided template or database
5. Optimizes minutiae for faster matching
6. Performs template matching using BOZORTH3
7. Returns match result with score and match status

## 3. Identify Fingerprint Endpoint

**URL:** `/api/fingerprints/identify-fingerprint/`  
**HTTP Method:** POST  
**View Class:** `IdentifyFingerprintView`  
**Authentication:** Required (IsAuthenticated permission class)

**Purpose:**
- Searches for matching fingerprints across all stored templates
- Used for 1:N identification rather than 1:1 verification

**Input Parameters:**
- `fingerprint`: Fingerprint image file (multipart/form-data)
- `threshold`: Minimum score to consider a match (default: 40)
- `limit`: Maximum number of matches to return (default: 5)

**Response:**
```json
{
  "matches": [
    {
      "template_id": "12345",
      "national_id": "1234567890",
      "match_score": 85,
      "created_at": "2025-06-24T10:30:45.123Z",
      "voter_name": "John Doe"
    },
    {
      "template_id": "12346",
      "national_id": "0987654321",
      "match_score": 65,
      "created_at": "2025-06-23T15:20:10.456Z"
    }
  ],
  "match_count": 2,
  "total_matches_found": 2,
  "threshold_used": 40,
  "templates_compared": 100
}
```

**Processing Flow:**
1. Processes uploaded fingerprint image
2. Extracts minutiae and optimizes for matching
3. Retrieves all templates from database
4. Compares probe template against each stored template
5. Collects matches that exceed threshold
6. Sorts matches by score and applies limit
7. Returns match results with metadata

## Implementation Details

### Data Model
The system uses the `FingerprintTemplate` model to store:
- `iso_template`: Binary ISO/IEC 19794-2 template data
- `iso_template_base64`: Base64-encoded template for easier transfer
- `xyt_data`: Raw XYT data for BOZORTH3 matching
- `national_id`: National ID the fingerprint belongs to
- `metadata`: Helper data for template fusion and verification
- `processing_status`: Status of template processing

### Key Utilities
- `normalize_image()`: Ensures consistent image format
- `extract_minutiae()`: Extracts minutiae using NBIS MINDTCT tool
- `Bozorth3Matcher`: Utility class for template matching

### Technical Notes
1. Templates are stabilized through minutiae fusion and standardization
2. Matching uses the NIST BOZORTH3 algorithm with configurable thresholds
3. The system handles both image-based and template-based fingerprint data
4. All endpoints enforce authentication through the `IsAuthenticated` permission class

## Known Issues and Areas for Improvement

Based on test results documented in `areasOfAttention.md`:

1. **ISO Template Header Issues**
   - Current dimensions: 62465x62465 (incorrect)
   - Current resolution: 256x10240 dpi (incorrect)
   - Expected dimensions: 500x550
   - Expected resolution: 96 dpi

2. **Bozorth3 Relaxed Threshold Test Failure**
   - Standard matching works but relaxed threshold fails
   - Need to investigate Bozorth3 error handling and threshold parameter usage

3. **Minutiae Distribution Issues**
   - High concentration of minutiae at position (499, 499)
   - Could indicate edge case handling problems in the extraction process

4. **Performance Considerations**
   - Bozorth3 matching operations account for 98.9% of total processing time
   - Consider parallel processing for multiple template comparisons
