const { checkForNewScannedImages, downloadFile, markFileAsProcessed } = require('./googleDriveServerService');
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Function to process new scanned images from Google Drive
async function processNewScannedImages() {
  try {
    const newFiles = await checkForNewScannedImages(GOOGLE_DRIVE_FOLDER_ID);
    
    if (newFiles && newFiles.length > 0) {
      console.log(`Found ${newFiles.length} new scanned images in Google Drive`);
      
      for (const file of newFiles) {
        try {
          // Download the file
          const fileContent = await downloadFile(file.id);
          
          // Convert to base64 for Claude API
          const base64Data = Buffer.from(fileContent).toString('base64');
          
          // Process with your existing Claude API function
          const processedResult = await processWithClaudeAPI([{
            name: file.name,
            type: file.mimeType,
            data: base64Data
          }]);
          
          // Store the processed result in your database or localStorage
          storeProcessedReceipt(processedResult);
          
          // Mark file as processed in Google Drive
          await markFileAsProcessed(file.id);
          
          console.log(`Successfully processed ${file.name}`);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in Google Drive processing:', error);
  }
}

// Set up periodic check for new files (e.g., every 5 minutes)
setInterval(processNewScannedImages, 5 * 60 * 1000);

// Also run immediately on startup
processNewScannedImages();

// Function to store processed receipts (modify to suit your storage solution)
function storeProcessedReceipt(processedResult) {
  if (processedResult && processedResult.results) {
    // Get existing receipts
    const existingData = JSON.parse(localStorage.getItem('processedReceipts') || '{"results":[]}');
    
    // Add new results
    existingData.results = [...existingData.results, ...processedResult.results];
    
    // Save back to localStorage
    localStorage.setItem('processedReceipts', JSON.stringify(existingData));
  }
}
