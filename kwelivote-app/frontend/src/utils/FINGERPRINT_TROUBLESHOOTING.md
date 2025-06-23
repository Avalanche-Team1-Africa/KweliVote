# Fingerprint Processing Troubleshooting Guide

This document explains how to troubleshoot common issues with fingerprint processing in the KweliVote application.

## Common Issues and Solutions

### "Too many values to unpack (expected 3)" Error

This error occurs when the backend fingerprint processing code tries to extract minutiae points from an image but encounters improperly formatted data.

#### Root Cause
The error happens when:
1. The image format is not properly recognized by the NIST fingerprint processing tools
2. The image doesn't contain clear fingerprint ridges and minutiae points 
3. The xyt data (x,y,theta coordinates) is not in the expected format

#### Solution
We've implemented several fixes to address this issue:

1. **Improved image preprocessing**:
   - Added validation of image dimensions before processing
   - Added better error handling for unsupported image formats
   - Added debugging logs to trace the image processing pipeline

2. **Enhanced error handling**:
   - Better error messages to guide users
   - Specific handling for "too many values to unpack" error
   - Validation of the template data structure

3. **Improved API communication**:
   - Fixed FormData creation to properly send images to the backend
   - Proper handling of authentication tokens
   - Improved response parsing

### Testing Fingerprint Image Processing

You can use the `debug_fingerprint_upload.js` script to test fingerprint image processing:

```bash
# First install required packages
npm install node-fetch form-data

# Then run the script with a test fingerprint image
node debug_fingerprint_upload.js /path/to/fingerprint/image.png
```

Remember to update the API URL and authentication token in the script before running it.

### Recommended Fingerprint Image Requirements

For best results, fingerprint images should:
- Be clear with visible ridge patterns
- Have a resolution of at least 500 DPI
- Be in PNG or JPEG format
- Have dimensions of at least 300x300 pixels
- Have good contrast between ridges and valleys

## Backend Processing Pipeline

The fingerprint processing pipeline involves these steps:

1. Image is uploaded to the backend
2. NIST MINDTCT extracts minutiae points in XYT format (x, y, angle)
3. Points are canonicalized, quantized, and optimized
4. An ISO/IEC 19794-2 template is generated
5. The template is returned to the frontend

If any of these steps fail, appropriate error messages are now displayed to the user.
