/**
 * Google Drive Batch Processing Script
 * This script demonstrates batch processing of Google Drive files at scheduled intervals
 */
require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Configure authentication
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY,
  ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata']
);

// Initialize the Drive API
const drive = google.drive({ version: 'v3', auth });

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log file path
const logFile = path.join(logDir, 'batch-process.log');

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
 * Get files from Google Drive folder that match the criteria
 * @param {string} query - The query to filter files
 * @returns {Promise<Array>} - Promise resolving to an array of files
 */
async function getFiles(query) {
  try {
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      orderBy: 'createdTime desc'
    });
    
    return response.data.files;
  } catch (error) {
    log(`Error getting files: ${error.message}`);
    if (error.response) {
      log(`Response error data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Mark a file as processed with a batch ID
 * @param {string} fileId - The ID of the file to mark as processed
 * @param {string} batchId - The batch ID
 */
async function markFileAsProcessed(fileId, batchId) {
  try {
    await drive.files.update({
      fileId: fileId,
      resource: {
        properties: {
          processed: 'true',
          processedTime: new Date().toISOString(),
          batchId: batchId
        }
      }
    });
    
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
 * Process a batch of files
 * @param {Array} files - The files to process
 * @param {string} batchId - The batch ID
 */
async function processBatch(files, batchId) {
  log(`Processing batch ${batchId} with ${files.length} files...`);
  
  // Simulate batch processing time (3-5 seconds)
  const processingTime = Math.floor(Math.random() * 2000) + 3000;
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Mark each file as processed with the batch ID
  for (const file of files) {
    await markFileAsProcessed(file.id, batchId);
    log(`Processed file: ${file.name} (${file.id}) in batch ${batchId}`);
  }
  
  log(`Batch ${batchId} completed in ${processingTime}ms`);
  
  // Return batch summary
  return {
    batchId,
    fileCount: files.length,
    processingTime,
    timestamp: new Date().toISOString()
  };
}

/**
 * Run a scheduled batch process
 */
async function runScheduledBatch() {
  const batchId = `batch-${Date.now()}`;
  log(`Starting scheduled batch process: ${batchId}`);
  
  // Get unprocessed files
  const query = `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false and (not properties has { key='processed' and value='true' })`;
  const files = await getFiles(query);
  
  if (files.length === 0) {
    log('No files to process in this batch');
    return null;
  }
  
  log(`Found ${files.length} files to process in batch ${batchId}`);
  
  // Process the batch
  const batchResult = await processBatch(files, batchId);
  
  // Save batch result to a JSON file
  const batchResultFile = path.join(logDir, `${batchId}.json`);
  fs.writeFileSync(batchResultFile, JSON.stringify(batchResult, null, 2));
  
  log(`Batch result saved to ${batchResultFile}`);
  
  return batchResult;
}

/**
 * Get batch processing history
 */
function getBatchHistory() {
  try {
    const batchFiles = fs.readdirSync(logDir)
      .filter(file => file.startsWith('batch-') && file.endsWith('.json'));
    
    const batches = batchFiles.map(file => {
      const filePath = path.join(logDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    });
    
    // Sort by timestamp (newest first)
    batches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return batches;
  } catch (error) {
    log(`Error getting batch history: ${error.message}`);
    return [];
  }
}

/**
 * Display batch processing history
 */
function displayBatchHistory() {
  const batches = getBatchHistory();
  
  if (batches.length === 0) {
    log('No batch processing history found');
    return;
  }
  
  log('\nBatch Processing History:');
  log('------------------------');
  
  batches.forEach((batch, index) => {
    const timestamp = new Date(batch.timestamp).toLocaleString();
    log(`${index + 1}. Batch ID: ${batch.batchId}`);
    log(`   Files Processed: ${batch.fileCount}`);
    log(`   Processing Time: ${batch.processingTime}ms`);
    log(`   Timestamp: ${timestamp}`);
    log('------------------------');
  });
}

/**
 * Start scheduled batch processing
 */
function startScheduledBatchProcessing() {
  log('Starting scheduled batch processing...');
  
  // Schedule batch processing every hour
  cron.schedule('0 * * * *', async () => {
    log('\n=== Hourly Batch Processing ===');
    await runScheduledBatch();
    displayBatchHistory();
  });
  
  // Schedule batch processing every day at midnight
  cron.schedule('0 0 * * *', async () => {
    log('\n=== Daily Batch Processing ===');
    await runScheduledBatch();
    displayBatchHistory();
  });
  
  log('Batch processing scheduled:');
  log('- Hourly: Every hour at minute 0');
  log('- Daily: Every day at midnight');
  
  // Run an initial batch process
  setTimeout(async () => {
    log('\n=== Initial Batch Processing ===');
    await runScheduledBatch();
    displayBatchHistory();
  }, 1000);
}

// For testing purposes, you can also run a batch process immediately
async function runTestBatch() {
  log('\n=== Test Batch Processing ===');
  await runScheduledBatch();
  displayBatchHistory();
}

// Start scheduled batch processing
startScheduledBatchProcessing();

// Handle command line arguments
if (process.argv.includes('--test')) {
  runTestBatch();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Batch processing stopped');
  process.exit(0);
});

log('Press Ctrl+C to stop batch processing');
