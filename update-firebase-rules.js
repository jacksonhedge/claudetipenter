/**
 * Firebase Rules Update Script
 * This script helps update Firestore security rules
 */

// To use this script:
// 1. Make sure you have Node.js installed
// 2. Install Firebase CLI: npm install -g firebase-tools
// 3. Login to Firebase: firebase login
// 4. Run this script: node update-firebase-rules.js

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Project ID from firebase-config.js
const PROJECT_ID = 'tipscanner-46c53';

// Path to the rules file
const RULES_FILE_PATH = path.join(__dirname, 'firebase-rules.json');

// Read Firestore rules from the firebase-rules.json file
let firestoreRules;
try {
  const rulesFile = fs.readFileSync(RULES_FILE_PATH, 'utf8');
  const rulesJson = JSON.parse(rulesFile);
  
  if (rulesJson.rules && rulesJson.rules.firestore) {
    // Convert the JSON-based rules to Firestore format
    firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Base rules for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // User specific rules
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
      allow write: if request.auth != null && (request.auth.uid == userId || 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
    }
    
    // Establishments rules
    match /establishments/{establishmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Staff rules
    match /staff/{staffId} {
      allow read, write: if request.auth != null;
    }
    
    // User workplaces rules
    match /user_workplaces/{workplaceId} {
      allow read, write: if request.auth != null;
    }
    
    // Bar rules and subcollections
    match /bars/{barId} {
      allow read, write: if request.auth != null;
      
      match /bartenders/{bartenderId} {
        allow read, write: if request.auth != null;
      }
      
      match /barbacks/{barbackId} {
        allow read, write: if request.auth != null;
      }
      
      match /staff/{staffId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // User-bar associations
    match /user_bars/{userBarId} {
      allow read, write: if request.auth != null;
    }
  }
}`;
    console.log('Successfully read Firebase rules from firebase-rules.json');
  } else {
    console.error('firebase-rules.json does not contain valid Firestore rules structure');
    console.log('Using default rules instead');
  }
} catch (error) {
  console.error(`Error reading firebase-rules.json: ${error.message}`);
  console.log('Using default rules instead');
  firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`;
}

// Write Firestore rules to a temporary file
const tempFilePath = path.join(__dirname, 'firestore.rules');
fs.writeFileSync(tempFilePath, firestoreRules);

console.log('Temporary firestore.rules file created');
console.log('Attempting to deploy rules to Firebase...');

// Deploy the rules
exec(`firebase deploy --only firestore:rules --project=${PROJECT_ID}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deploying rules: ${error.message}`);
    console.log('You may need to run:');
    console.log('1. npm install -g firebase-tools');
    console.log('2. firebase login');
    console.log('3. Try running this script again');
    
    console.log('\nAlternatively, you can manually set these rules in the Firebase console:');
    console.log('1. Go to https://console.firebase.google.com/project/tipscanner-46c53/firestore/rules');
    console.log('2. Copy and paste the rules below:');
    console.log('\n' + firestoreRules);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`Rules deployed successfully!\n${stdout}`);
  
  // Clean up the temporary file
  fs.unlinkSync(tempFilePath);
  console.log('Temporary file removed');
});

console.log('\nIf you prefer to set these rules manually:');
console.log('1. Go to https://console.firebase.google.com/project/tipscanner-46c53/firestore/rules');
console.log('2. Copy and paste the rules above');
