#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('kwelivote-app', 'frontend', 'src', 'components', 'keyperson', 'KeypersonStep2.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic code
const oldCode = `          // Create FormData for API request
          const formData = new FormData();
          formData.append('fingerprint', file);
          formData.append('nationalId', formData.nationalid);`;

const newCode = `          // Create FormData for API request
          const uploadData = new FormData();
          uploadData.append('fingerprint', file);
          uploadData.append('nationalId', formData.nationalid);`;

content = content.replace(oldCode, newCode);

// Update the response fetch call
const oldFetch = `          // Call API to process the fingerprint image
          const response = await fetch(\`\${apiServices.API_BASE_URL}/fingerprints/process-template/\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${localStorage.getItem('authToken')}\`
            },
            body: formData
          });`;

const newFetch = `          // Call API to process the fingerprint image
          const response = await fetch(\`\${apiServices.API_BASE_URL}/fingerprints/process/\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${localStorage.getItem('authToken') || 
                              (JSON.parse(sessionStorage.getItem('userInfo') || '{}').token || '')}\`
            },
            body: uploadData
          });`;

content = content.replace(oldFetch, newFetch);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('KeypersonStep2.js updated successfully!');
