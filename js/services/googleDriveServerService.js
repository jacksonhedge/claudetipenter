// Google Drive integration service - to be added to your codebase
import { google } from 'googleapis';

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
}

const auth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey,
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
