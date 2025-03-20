/**
 * Test script for Google Drive integration
 * This script tests the connection to Google Drive and lists files in the specified folder
 */
require('dotenv').config();
const { google } = require('googleapis');

// Log environment variables (without sensitive values)
console.log('Testing Google Drive integration with:');
console.log(`- Client Email: ${process.env.GOOGLE_CLIENT_EMAIL}`);
console.log(`- Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
console.log('- Private Key: [REDACTED]');

// Configure authentication
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY,
  ['https://www.googleapis.com/auth/drive.readonly']
);

// Initialize the Drive API
const drive = google.drive({ version: 'v3', auth });

/**
 * List files in the specified Google Drive folder
 */
async function listFiles() {
  try {
    console.log(`\nListing files in folder: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
    
    // Get files from the folder
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });
    
    const files = response.data.files;
    
    if (files.length === 0) {
      console.log('No files found in the specified folder.');
    } else {
      console.log(`Found ${files.length} files:`);
      console.log('----------------------------');
      
      files.forEach((file, i) => {
        const modifiedDate = new Date(file.modifiedTime).toLocaleString();
        console.log(`${i+1}. ${file.name} (${file.mimeType})`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Modified: ${modifiedDate}`);
        console.log('----------------------------');
      });
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Check for unprocessed files in the Google Drive folder
 */
async function checkForUnprocessedFiles() {
  try {
    console.log(`\nChecking for unprocessed files in folder: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
    
    // Get files that don't have the 'processed' property set to 'true'
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false and (not properties has { key='processed' and value='true' })`,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      orderBy: 'createdTime desc'
    });
    
    const files = response.data.files;
    
    if (files.length === 0) {
      console.log('No unprocessed files found.');
    } else {
      console.log(`Found ${files.length} unprocessed files:`);
      console.log('----------------------------');
      
      files.forEach((file, i) => {
        const createdDate = new Date(file.createdTime).toLocaleString();
        console.log(`${i+1}. ${file.name} (${file.mimeType})`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Created: ${createdDate}`);
        console.log('----------------------------');
      });
    }
    
    return files;
  } catch (error) {
    console.error('Error checking for unprocessed files:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Mark a file as processed
 * @param {string} fileId - The ID of the file to mark as processed
 */
async function markFileAsProcessed(fileId) {
  try {
    console.log(`\nMarking file ${fileId} as processed...`);
    
    await drive.files.update({
      fileId: fileId,
      resource: {
        properties: {
          processed: 'true',
          processedTime: new Date().toISOString()
        }
      }
    });
    
    console.log('File marked as processed successfully.');
  } catch (error) {
    console.error('Error marking file as processed:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test authentication and list all files
    const allFiles = await listFiles();
    
    // Check for unprocessed files
    const unprocessedFiles = await checkForUnprocessedFiles();
    
    // If there are unprocessed files, mark the first one as processed as a test
    if (unprocessedFiles.length > 0) {
      const fileToMark = unprocessedFiles[0];
      console.log(`\nWill mark file "${fileToMark.name}" as processed for testing purposes.`);
      
      const confirmMark = true; // Set to false to skip marking
      if (confirmMark) {
        await markFileAsProcessed(fileToMark.id);
        
        // Verify the file is now marked as processed
        const updatedUnprocessedFiles = await checkForUnprocessedFiles();
        const stillUnprocessed = updatedUnprocessedFiles.some(file => file.id === fileToMark.id);
        
        if (!stillUnprocessed) {
          console.log(`\nSuccess! File "${fileToMark.name}" is no longer in the unprocessed list.`);
        } else {
          console.log(`\nWarning: File "${fileToMark.name}" is still in the unprocessed list.`);
        }
      }
    }
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
