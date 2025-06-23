#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('kwelivote-app', 'frontend', 'src', 'components', 'voter', 'VoterStep2.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the endpoint with one that exists in the API
const oldEndpoint = `/fingerprints/process-fingerprint-template/`;
const newEndpoint = `/fingerprints/process/`;

content = content.replace(oldEndpoint, newEndpoint);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Endpoint updated successfully!');
