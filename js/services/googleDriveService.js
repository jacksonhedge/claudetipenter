/**
 * Google Drive Service
 * Handles authentication and file operations with Google Drive API
 */

/**
 * Google Drive API configuration
 */
const GOOGLE_DRIVE_CONFIG = {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: '', // Will be set by the user in the Google Cloud Console
    redirectUri: 'https://tipenters.com/oauth2callback',
    scope: 'https://www.googleapis.com/auth/drive.file',
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent'
};

/**
 * Get the authentication URL for Google Drive
 * @returns {string} - The authentication URL
 */
export function getGoogleDriveAuthUrl() {
    const params = new URLSearchParams({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        redirect_uri: GOOGLE_DRIVE_CONFIG.redirectUri,
        scope: GOOGLE_DRIVE_CONFIG.scope,
        response_type: GOOGLE_DRIVE_CONFIG.responseType,
        access_type: GOOGLE_DRIVE_CONFIG.accessType,
        prompt: GOOGLE_DRIVE_CONFIG.prompt,
        state: JSON.stringify({ action: 'google_drive_auth' })
    });
    
    return `${GOOGLE_DRIVE_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Check if the user is authenticated with Google Drive
 * @returns {boolean} - Whether the user is authenticated with Google Drive
 */
export function isGoogleDriveAuthenticated() {
    return !!localStorage.getItem('google_drive_token');
}

/**
 * Authenticate with Google Drive
 */
export function authenticateWithGoogleDrive() {
    if (!GOOGLE_DRIVE_CONFIG.clientId) {
        console.error('Google Drive client ID is not set');
        alert('Google Drive client ID is not configured. Please contact the administrator.');
        return;
    }
    
    const authUrl = getGoogleDriveAuthUrl();
    window.location.href = authUrl;
}

/**
 * Handle the authentication callback from Google Drive
 * @param {string} code - The authorization code
 * @param {string} state - The state parameter
 * @returns {Promise<Object>} - Promise resolving to the token object
 */
export async function handleGoogleDriveCallback(code, state) {
    try {
        // In a production environment, this should be done server-side
        // For security reasons, the token exchange should not be done in client-side code
        
        // This is a placeholder for the server-side implementation
        console.log('Received authorization code:', code);
        console.log('State:', state);
        
        // Simulate successful authentication for demo purposes
        const tokenObj = {
            access_token: 'simulated_access_token',
            refresh_token: 'simulated_refresh_token',
            expires_in: 3600,
            token_type: 'Bearer'
        };
        
        // Store token in localStorage
        localStorage.setItem('google_drive_token', JSON.stringify(tokenObj));
        
        return tokenObj;
    } catch (error) {
        console.error('Error handling Google Drive callback:', error);
        throw error;
    }
}

/**
 * Upload a file to Google Drive
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Promise resolving to the uploaded file metadata
 */
export async function uploadFileToDrive(file) {
    try {
        if (!isGoogleDriveAuthenticated()) {
            throw new Error('Not authenticated with Google Drive');
        }
        
        const tokenObj = JSON.parse(localStorage.getItem('google_drive_token'));
        
        // In a production environment, this should be done server-side
        // For security reasons, API calls with the access token should not be done in client-side code
        
        // This is a placeholder for the server-side implementation
        console.log('Uploading file to Google Drive:', file.name);
        
        // Simulate successful upload for demo purposes
        const fileMetadata = {
            id: 'simulated_file_id_' + Date.now(),
            name: file.name,
            mimeType: file.type,
            webViewLink: 'https://drive.google.com/file/d/simulated_file_id/view',
            webContentLink: 'https://drive.google.com/uc?id=simulated_file_id'
        };
        
        return fileMetadata;
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
}

/**
 * Create a folder in Google Drive
 * @param {string} folderName - The name of the folder to create
 * @returns {Promise<Object>} - Promise resolving to the created folder metadata
 */
export async function createDriveFolder(folderName) {
    try {
        if (!isGoogleDriveAuthenticated()) {
            throw new Error('Not authenticated with Google Drive');
        }
        
        const tokenObj = JSON.parse(localStorage.getItem('google_drive_token'));
        
        // In a production environment, this should be done server-side
        // For security reasons, API calls with the access token should not be done in client-side code
        
        // This is a placeholder for the server-side implementation
        console.log('Creating folder in Google Drive:', folderName);
        
        // Simulate successful folder creation for demo purposes
        const folderMetadata = {
            id: 'simulated_folder_id_' + Date.now(),
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        return folderMetadata;
    } catch (error) {
        console.error('Error creating folder in Google Drive:', error);
        throw error;
    }
}

/**
 * Upload a file to a specific folder in Google Drive
 * @param {File} file - The file to upload
 * @param {string} folderId - The ID of the folder to upload to
 * @returns {Promise<Object>} - Promise resolving to the uploaded file metadata
 */
export async function uploadFileToDriveFolder(file, folderId) {
    try {
        if (!isGoogleDriveAuthenticated()) {
            throw new Error('Not authenticated with Google Drive');
        }
        
        const tokenObj = JSON.parse(localStorage.getItem('google_drive_token'));
        
        // In a production environment, this should be done server-side
        // For security reasons, API calls with the access token should not be done in client-side code
        
        // This is a placeholder for the server-side implementation
        console.log('Uploading file to Google Drive folder:', file.name, 'Folder ID:', folderId);
        
        // Simulate successful upload for demo purposes
        const fileMetadata = {
            id: 'simulated_file_id_' + Date.now(),
            name: file.name,
            mimeType: file.type,
            parents: [folderId],
            webViewLink: 'https://drive.google.com/file/d/simulated_file_id/view',
            webContentLink: 'https://drive.google.com/uc?id=simulated_file_id'
        };
        
        return fileMetadata;
    } catch (error) {
        console.error('Error uploading file to Google Drive folder:', error);
        throw error;
    }
}

/**
 * List files in a Google Drive folder
 * @param {string} folderId - The ID of the folder to list files from
 * @returns {Promise<Array>} - Promise resolving to an array of file metadata
 */
export async function listDriveFiles(folderId = 'root') {
    try {
        if (!isGoogleDriveAuthenticated()) {
            throw new Error('Not authenticated with Google Drive');
        }
        
        const tokenObj = JSON.parse(localStorage.getItem('google_drive_token'));
        
        // In a production environment, this should be done server-side
        // For security reasons, API calls with the access token should not be done in client-side code
        
        // This is a placeholder for the server-side implementation
        console.log('Listing files in Google Drive folder:', folderId);
        
        // Simulate successful file listing for demo purposes
        const files = [
            {
                id: 'simulated_file_id_1',
                name: 'Sample Receipt 1.jpg',
                mimeType: 'image/jpeg',
                webViewLink: 'https://drive.google.com/file/d/simulated_file_id_1/view',
                webContentLink: 'https://drive.google.com/uc?id=simulated_file_id_1'
            },
            {
                id: 'simulated_file_id_2',
                name: 'Sample Receipt 2.jpg',
                mimeType: 'image/jpeg',
                webViewLink: 'https://drive.google.com/file/d/simulated_file_id_2/view',
                webContentLink: 'https://drive.google.com/uc?id=simulated_file_id_2'
            }
        ];
        
        return files;
    } catch (error) {
        console.error('Error listing files in Google Drive folder:', error);
        throw error;
    }
}

/**
 * Set the Google Drive client ID
 * @param {string} clientId - The client ID to set
 */
export function setGoogleDriveClientId(clientId) {
    GOOGLE_DRIVE_CONFIG.clientId = clientId;
    localStorage.setItem('google_drive_client_id', clientId);
}

/**
 * Initialize Google Drive service
 */
export function initGoogleDriveService() {
    // Load client ID from localStorage if available
    const savedClientId = localStorage.getItem('google_drive_client_id');
    if (savedClientId) {
        GOOGLE_DRIVE_CONFIG.clientId = savedClientId;
    }
    
    // Check if we're on the OAuth callback page
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        // Handle OAuth callback
        handleGoogleDriveCallback(code, state)
            .then(() => {
                // Redirect to the main page or handle as needed
                window.location.href = 'home.html';
            })
            .catch(error => {
                console.error('Error handling OAuth callback:', error);
                alert('Error authenticating with Google Drive. Please try again.');
                window.location.href = 'home.html';
            });
    }
}
