/**
 * Background Upload Service
 * Handles background uploads to Google Drive without blocking the main UI
 */
import { uploadFileToDriveFolder, isGoogleDriveAuthenticated, createDriveFolder } from './googleDriveService.js';
import { showNotification } from '../utils/uiUtils.js';
import config from '../config.js';

// Google Drive folder ID where files will be uploaded
const GOOGLE_DRIVE_FOLDER_ID = '1s1lUWAZb8PqD-T8wgmzT-jTaPTBTHLUq';

// Server API URL
const SERVER_API_URL = config.serverUrl || 'http://localhost:4000';

// Queue for background uploads
const uploadQueue = [];
let isProcessingQueue = false;

/**
 * Add files to the background upload queue
 * @param {Array} files - Array of file objects with base64 data
 * @returns {Promise<void>}
 */
export async function queueFilesForGoogleDriveUpload(files) {
    if (!files || files.length === 0) {
        console.log('🔍 [Google Drive] No files to queue for upload');
        return;
    }

    // For server-side authentication with service account, we don't need client-side token
    // We'll let the server handle authentication with the service account credentials
    console.log(`📋 [Google Drive] Queuing ${files.length} files for background upload`);
    console.log(`📋 [Google Drive] File names:`, files.map(file => file.name).join(', '));
    
    // Add files to the queue
    files.forEach(file => {
        uploadQueue.push(file);
        console.log(`➕ [Google Drive] Added to queue: ${file.name} (${file.type})`);
    });
    
    // Start processing the queue if not already processing
    if (!isProcessingQueue) {
        console.log('🚀 [Google Drive] Starting queue processing');
        processUploadQueue();
    } else {
        console.log('⏳ [Google Drive] Queue processing already in progress');
    }
}

/**
 * Process the upload queue in the background
 */
async function processUploadQueue() {
    if (isProcessingQueue || uploadQueue.length === 0) {
        console.log('🔍 [Google Drive] Queue processing skipped - already processing or empty queue');
        return;
    }
    
    isProcessingQueue = true;
    console.log(`🔄 [Google Drive] Starting background upload process for ${uploadQueue.length} files`);
    
    try {
        // Process each file in the queue
        while (uploadQueue.length > 0) {
            const file = uploadQueue.shift();
            console.log(`⏳ [Google Drive] Processing file: ${file.name} (${file.type})`);
            
            try {
                // Convert base64 data to a File object
                console.log(`🔄 [Google Drive] Converting base64 to Blob for ${file.name}`);
                const fileBlob = base64ToBlob(file.data, file.type);
                const fileObj = new File([fileBlob], file.name, { type: file.type });
                console.log(`✓ [Google Drive] Created File object: ${fileObj.name}, size: ${fileObj.size} bytes`);
                
                // Create JSON payload for server upload
                console.log(`🔄 [Google Drive] Creating JSON payload for server upload`);
                const payload = {
                    fileData: file.data,
                    fileName: file.name,
                    fileType: file.type,
                    folderId: GOOGLE_DRIVE_FOLDER_ID
                };
                
                // Upload directly to server endpoint
                const uploadUrl = `${SERVER_API_URL}/api/google-drive/upload`;
                console.log(`📤 [Google Drive] Sending file directly to server endpoint: ${uploadUrl}`);
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log(`✅ [Google Drive] Successfully uploaded ${file.name}`, result);
            } catch (error) {
                console.error(`❌ [Google Drive] Error uploading ${file.name}:`, error);
                console.error(`❌ [Google Drive] Error details:`, error.message);
                // Continue with next file even if there's an error
            }
        }
        
        // Show success notification when all uploads are complete
        console.log(`🎉 [Google Drive] All files have been processed`);
        showNotification('All files have been uploaded to Google Drive', 'success', 3000);
    } catch (error) {
        console.error('❌ [Google Drive] Error processing upload queue:', error);
        console.error('❌ [Google Drive] Error details:', error.message);
    } finally {
        isProcessingQueue = false;
        console.log(`✓ [Google Drive] Queue processing complete`);
        
        // If new files were added to the queue during processing, start again
        if (uploadQueue.length > 0) {
            console.log(`🔄 [Google Drive] New files were added during processing, starting again`);
            processUploadQueue();
        }
    }
}

/**
 * Convert base64 data to a Blob
 * @param {string} base64Data - Base64 encoded data
 * @param {string} contentType - MIME type of the data
 * @returns {Blob} - Blob object
 */
function base64ToBlob(base64Data, contentType) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: contentType });
}
