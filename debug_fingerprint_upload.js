/**
 * debug_fingerprint_upload.js - Utility script to test fingerprint image processing
 * 
 * This script can be used to diagnose issues with fingerprint image processing by:
 * 1. Converting an image file to base64
 * 2. Creating a FormData object with the file
 * 3. Sending the request to the backend API
 * 4. Showing detailed debug information about each step
 * 
 * Usage: 
 * node debug_fingerprint_upload.js <path-to-image-file>
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// API Base URL - update this to match your backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function debugFingerprintProcessing(imagePath) {
  try {
    console.log(`\n=== FINGERPRINT IMAGE DEBUG UTILITY ===`);
    console.log(`Testing image: ${imagePath}`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(imagePath);
    const fileSize = fileBuffer.length;
    const fileExtension = path.extname(imagePath).toLowerCase();
    
    // Determine mime type
    let mimeType;
    switch (fileExtension) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.bmp':
        mimeType = 'image/bmp';
        break;
      case '.tiff':
      case '.tif':
        mimeType = 'image/tiff';
        break;
      default:
        throw new Error(`Unsupported file extension: ${fileExtension}`);
    }
    
    console.log(`\n=== FILE INFORMATION ===`);
    console.log(`Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`MIME type: ${mimeType}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('fingerprints', fileBuffer, {
      filename: path.basename(imagePath),
      contentType: mimeType
    });
    
    console.log(`\n=== SENDING REQUEST ===`);
    console.log(`Endpoint: ${API_BASE_URL}/fingerprints/process-fingerprint-template/`);
    console.log(`Method: POST`);
    
    // Send the request
    const response = await fetch(`${API_BASE_URL}/fingerprints/process-fingerprint-template/`, {
      method: 'POST',
      body: formData,
      headers: {
        // FormData sets its own Content-Type with boundary
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Update this with a valid token
      }
    });
    
    console.log(`\n=== RESPONSE ===`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    console.log(`Headers: ${JSON.stringify(responseHeaders, null, 2)}`);
    
    // Get response as text first
    const responseText = await response.text();
    console.log(`Response body length: ${responseText.length} bytes`);
    
    // Try to parse as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log(`\n=== PARSED JSON RESPONSE ===`);
      if (responseData.error) {
        console.log(`Error: ${responseData.error}`);
      } else if (responseData.iso_template_base64) {
        console.log(`Success! Received template data`);
        console.log(`Template size: ${responseData.iso_template_base64.length} bytes`);
        if (responseData.metadata) {
          console.log(`Metadata: ${JSON.stringify(responseData.metadata, null, 2)}`);
        }
      } else {
        console.log(`Response: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (e) {
      console.log(`\n=== RAW RESPONSE (not JSON) ===`);
      console.log(responseText);
    }
    
  } catch (error) {
    console.error(`\n=== ERROR ===`);
    console.error(error);
  }
}

// Get image path from command line arguments
const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Please provide an image path as argument');
  console.error('Usage: node debug_fingerprint_upload.js <path-to-image-file>');
  process.exit(1);
}

debugFingerprintProcessing(imagePath);
