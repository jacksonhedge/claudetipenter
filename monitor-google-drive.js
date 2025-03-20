/**
 * Google Drive Monitoring Script
 * This script continuously monitors a Google Drive folder for new files
 * and simulates processing them in real-time
 */
require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Helper function to safely get and format the private key
function getFormattedPrivateKey() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('GOOGLE_PRIVATE_KEY environment variable is not set');
    return null;
  }
  
  // If the key already contains newlines, it's likely already formatted correctly
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    return privateKey.replace(/\\n/g, '\n');
  }
  
  // Check if it's a simple API key or token format (no spaces, no special characters except maybe hyphens)
  if (/^[a-zA-Z0-9\-]+$/.test(privateKey.replace(/"/g, ''))) {
    console.warn('GOOGLE_PRIVATE_KEY appears to be an API key or token, not a PEM-formatted private key.');
    console.warn('Using it as-is, but authentication may fail if a proper service account private key is required.');
    return privateKey.replace(/"/g, ''); // Remove any quotes
  }
  
  console.error('GOOGLE_PRIVATE_KEY is not in the correct format. It should be a PEM formatted private key.');
  return null;
}

// Configure authentication
const privateKey = getFormattedPrivateKey();
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

if (!privateKey || !clientEmail) {
  console.error('Google Drive integration is not properly configured. Check your environment variables.');
  process.exit(1);
}

const auth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly']
);

// Initialize the Drive API
const drive = google.drive({ version: 'v3', auth });

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log file path
const logFile = path.join(logDir, 'drive-monitor.log');

/**
 * Write a message to the log file and console
 * @param {string} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Append to log file
  fs.appendFileSync(logFile, logMessage);
}

/**
 * Check for new files in the Google Drive folder
 * @returns {Promise<Array>} - Promise resolving to an array of new files
 */
async function checkForNewFiles() {
  try {
    // Get files from the folder that haven't been processed
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false and (not properties has { key='processed' and value='true' })`,
      fields: 'files(id, name, mimeType, createdTime)',
      orderBy: 'createdTime desc'
    });
    
    return response.data.files;
  } catch (error) {
    log(`Error checking for new files: ${error.message}`);
    if (error.response) {
      log(`Response error data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Mark a file as processed
 * @param {string} fileId - The ID of the file to mark as processed
 */
async function markFileAsProcessed(fileId) {
  try {
    await drive.files.update({
      fileId: fileId,
      resource: {
        properties: {
          processed: 'true',
          processedTime: new Date().toISOString()
        }
      }
    });
    
    log(`File ${fileId} marked as processed successfully.`);
    return true;
  } catch (error) {
    log(`Error marking file as processed: ${error.message}`);
    if (error.response) {
      log(`Response error data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Simulate processing a file
 * @param {Object} file - The file to process
 */
async function simulateProcessFile(file) {
  log(`Processing file: ${file.name} (${file.id})`);
  
  // Simulate processing time (1-3 seconds)
  const processingTime = Math.floor(Math.random() * 2000) + 1000;
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Simulate successful processing
  log(`Successfully processed file: ${file.name} (took ${processingTime}ms)`);
  
  // Mark file as processed
  await markFileAsProcessed(file.id);
}

/**
 * Monitor Google Drive folder for new files
 */
async function monitorDriveFolder() {
  log('Starting Google Drive folder monitoring...');
  log(`Monitoring folder: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
  
  // Initial check
  let lastCheckTime = new Date();
  let newFiles = await checkForNewFiles();
  log(`Initial check: Found ${newFiles.length} unprocessed files`);
  
  // Process any existing files
  for (const file of newFiles) {
    await simulateProcessFile(file);
  }
  
  // Set up interval to check for new files
  setInterval(async () => {
    const currentTime = new Date();
    log(`Checking for new files (last check: ${lastCheckTime.toLocaleTimeString()})`);
    
    newFiles = await checkForNewFiles();
    
    if (newFiles.length > 0) {
      log(`Found ${newFiles.length} new files to process`);
      
      // Process each file
      for (const file of newFiles) {
        await simulateProcessFile(file);
      }
    } else {
      log('No new files found');
    }
    
    lastCheckTime = currentTime;
  }, 30000); // Check every 30 seconds
}

// Start monitoring
monitorDriveFolder().catch(error => {
  log(`Error in monitoring: ${error.message}`);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Monitoring stopped');
  process.exit(0);
});

log('Press Ctrl+C to stop monitoring');
