/**
 * Firebase Storage Rules Update Script
 * This script helps update Firebase Storage security rules
 */

// To use this script:
// 1. Make sure you have Node.js installed
// 2. Install Firebase CLI: npm install -g firebase-tools
// 3. Login to Firebase: firebase login
// 4. Run this script: node update-firebase-storage-rules.js

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Project ID from firebase-config.js
const PROJECT_ID = 'tipscanner-46c53';

// Get Storage rules from the firebase-rules.json file
let storageRules;
try {
  const rulesFile = fs.readFileSync(path.join(__dirname, 'firebase-rules.json'), 'utf8');
  const rulesJson = JSON.parse(rulesFile);
  
  if (rulesJson.rules && rulesJson.rules.storage) {
    // Convert the JSON-based rules to Storage format
    storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{barId}/{allPaths=**} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.role == 'manager');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /exports/{userId}/{barId}/{allPaths=**} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.role == 'manager');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
    console.log('Successfully read Firebase Storage rules from firebase-rules.json');
  } else {
    console.error('firebase-rules.json does not contain valid Storage rules structure');
    console.log('Using default rules instead');
    storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
  }
} catch (error) {
  console.error(`Error reading firebase-rules.json: ${error.message}`);
  console.log('Using default rules instead');
  storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
}

// Write Storage rules to a temporary file
const tempFilePath = path.join(__dirname, 'storage.rules');
fs.writeFileSync(tempFilePath, storageRules);

console.log('Temporary storage.rules file created');
console.log('Attempting to deploy rules to Firebase Storage...');

// Deploy the rules
exec(`firebase deploy --only storage --project=${PROJECT_ID}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deploying rules: ${error.message}`);
    console.log('You may need to run:');
    console.log('1. npm install -g firebase-tools');
    console.log('2. firebase login');
    console.log('3. Try running this script again');
    
    console.log('\nAlternatively, you can manually set these rules in the Firebase console:');
    console.log('1. Go to https://console.firebase.google.com/project/tipscanner-46c53/storage/rules');
    console.log('2. Copy and paste the rules below:');
    console.log('\n' + storageRules);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`Storage rules deployed successfully!\n${stdout}`);
  
  // Clean up the temporary file
  fs.unlinkSync(tempFilePath);
  console.log('Temporary file removed');
});

console.log('\nIf you prefer to set these rules manually:');
console.log('1. Go to https://console.firebase.google.com/project/tipscanner-46c53/storage/rules');
console.log('2. Copy and paste the rules below:');
console.log('\n' + storageRules);
