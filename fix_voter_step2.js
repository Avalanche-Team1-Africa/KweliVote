#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('kwelivote-app', 'frontend', 'src', 'components', 'voter', 'VoterStep2.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic code
const oldCode = `          // Create FormData for API request
          const formData = new FormData();
          formData.append('fingerprint', file);
          formData.append('nationalId', formData.nationalid || '');
          
          // Get the auth token from localStorage or sessionStorage
          const authToken = localStorage.getItem('authToken') || 
                           (JSON.parse(sessionStorage.getItem('userInfo') || '{}').token || '');
          
          console.log('Processing fingerprint with national ID:', formData.nationalid);
          
          // Use the correct endpoint from the API services
          const response = await fetch(\`\${apiServices.API_BASE_URL}/fingerprints/process-fingerprint-template/\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${authToken}\`
            },
            body: formData
          });`;

const newCode = `          // Create FormData for API request
          const uploadData = new FormData();
          uploadData.append('fingerprint', file);
          uploadData.append('nationalId', formData.nationalid);
          
          // Get the auth token from localStorage or sessionStorage
          const authToken = localStorage.getItem('authToken') || 
                           (JSON.parse(sessionStorage.getItem('userInfo') || '{}').token || '');
          
          console.log('Processing fingerprint with national ID:', formData.nationalid);
          
          // Use the correct endpoint from the API services
          const response = await fetch(\`\${apiServices.API_BASE_URL}/fingerprints/process-fingerprint-template/\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${authToken}\`
            },
            body: uploadData
          });`;

content = content.replace(oldCode, newCode);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('File updated successfully!');
