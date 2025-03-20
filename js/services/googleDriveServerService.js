// Google Drive integration service - to be added to your codebase
import { google } from 'googleapis';

// Configure authentication
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive.readonly']
);

// Initialize the Drive API
const drive = google.drive({ version: 'v3', auth });

// Function to check for new files
export async function checkForNewScannedImages(folderId) {
  try {
    // Get files from the folder that haven't been processed
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and properties has { key='processed' and value='false' }`,
      fields: 'files(id, name, mimeType, webContentLink)',
    });

    return response.data.files;
  } catch (error) {
    console.error('Error checking Google Drive for new images:', error);
    throw error;
  }
}

// Function to download file content
export async function downloadFile(fileId) {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading file from Google Drive:', error);
    throw error;
  }
}

// Mark file as processed
export async function markFileAsProcessed(fileId) {
  try {
    await drive.files.update({
      fileId: fileId,
      resource: {
        properties: {
          processed: 'true'
        }
      }
    });
  } catch (error) {
    console.error('Error marking file as processed:', error);
    throw error;
  }
}
