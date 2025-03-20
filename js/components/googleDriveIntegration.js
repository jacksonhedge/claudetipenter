/**
 * Google Drive Integration Component
 * Provides UI and functionality for Google Drive integration
 */
import { 
    authenticateWithGoogleDrive, 
    isGoogleDriveAuthenticated, 
    listDriveFiles,
    uploadFileToDrive,
    setGoogleDriveClientId
} from '../services/googleDriveService.js';
import { addFiles } from '../services/fileService.js';
import { showNotification } from '../utils/uiUtils.js';

export class GoogleDriveIntegration {
    /**
     * Create a new GoogleDriveIntegration instance
     * @param {HTMLElement} container - The container element
     * @param {Function} onFileAdded - Callback for when files are added
     */
    constructor(container, onFileAdded) {
        this.container = container;
        this.onFileAdded = onFileAdded;
        this.isAuthenticated = isGoogleDriveAuthenticated();
        this.driveFiles = [];
        
        this.render();
    }
    
    /**
     * Render the Google Drive integration UI
     */
    render() {
        // Create container
        const driveContainer = document.createElement('div');
        driveContainer.className = 'google-drive-container';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'drive-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Google Drive Integration';
        
        const icon = document.createElement('i');
        icon.className = 'fab fa-google-drive';
        title.prepend(icon);
        
        header.appendChild(title);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'drive-content';
        
        if (this.isAuthenticated) {
            // Authenticated view
            content.appendChild(this.createAuthenticatedView());
        } else {
            // Unauthenticated view
            content.appendChild(this.createUnauthenticatedView());
        }
        
        // Assemble component
        driveContainer.appendChild(header);
        driveContainer.appendChild(content);
        
        // Add to container
        this.container.appendChild(driveContainer);
    }
    
    /**
     * Create the unauthenticated view
     * @returns {HTMLElement} - The unauthenticated view element
     */
    createUnauthenticatedView() {
        const view = document.createElement('div');
        view.className = 'drive-unauthenticated';
        
        const message = document.createElement('p');
        message.textContent = 'Connect to Google Drive to import receipt images directly from your Drive.';
        
        const clientIdContainer = document.createElement('div');
        clientIdContainer.className = 'client-id-container';
        
        const clientIdLabel = document.createElement('label');
        clientIdLabel.textContent = 'Google Drive Client ID:';
        clientIdLabel.htmlFor = 'google-drive-client-id';
        
        const clientIdInput = document.createElement('input');
        clientIdInput.type = 'text';
        clientIdInput.id = 'google-drive-client-id';
        clientIdInput.placeholder = 'Enter your Google Drive Client ID';
        
        const clientIdHelp = document.createElement('p');
        clientIdHelp.className = 'help-text';
        clientIdHelp.innerHTML = 'You need to create a project in the <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a> and enable the Google Drive API. Then create OAuth credentials with the redirect URI: <code>https://tipenters.com/oauth2callback</code>';
        
        clientIdContainer.appendChild(clientIdLabel);
        clientIdContainer.appendChild(clientIdInput);
        clientIdContainer.appendChild(clientIdHelp);
        
        const connectButton = document.createElement('button');
        connectButton.className = 'drive-connect-btn';
        connectButton.innerHTML = '<i class="fab fa-google"></i> Connect to Google Drive';
        connectButton.addEventListener('click', () => {
            const clientId = clientIdInput.value.trim();
            if (!clientId) {
                showNotification('Please enter your Google Drive Client ID', 'error');
                return;
            }
            
            // Save client ID and authenticate
            setGoogleDriveClientId(clientId);
            authenticateWithGoogleDrive();
        });
        
        view.appendChild(message);
        view.appendChild(clientIdContainer);
        view.appendChild(connectButton);
        
        return view;
    }
    
    /**
     * Create the authenticated view
     * @returns {HTMLElement} - The authenticated view element
     */
    createAuthenticatedView() {
        const view = document.createElement('div');
        view.className = 'drive-authenticated';
        
        const message = document.createElement('p');
        message.textContent = 'Connected to Google Drive. Select files to import:';
        
        // Create file list container
        const fileListContainer = document.createElement('div');
        fileListContainer.className = 'drive-file-list-container';
        
        const fileList = document.createElement('div');
        fileList.className = 'drive-file-list';
        
        // Loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'drive-loading';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading files...';
        fileList.appendChild(loadingIndicator);
        
        fileListContainer.appendChild(fileList);
        
        // Create buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'drive-buttons';
        
        const refreshButton = document.createElement('button');
        refreshButton.className = 'drive-refresh-btn';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshButton.addEventListener('click', () => this.loadDriveFiles(fileList));
        
        const importButton = document.createElement('button');
        importButton.className = 'drive-import-btn';
        importButton.innerHTML = '<i class="fas fa-file-import"></i> Import Selected';
        importButton.disabled = true;
        importButton.addEventListener('click', () => this.importSelectedFiles());
        
        buttonContainer.appendChild(refreshButton);
        buttonContainer.appendChild(importButton);
        
        // Assemble view
        view.appendChild(message);
        view.appendChild(fileListContainer);
        view.appendChild(buttonContainer);
        
        // Load files
        this.loadDriveFiles(fileList, importButton);
        
        return view;
    }
    
    /**
     * Load files from Google Drive
     * @param {HTMLElement} fileListElement - The file list element to populate
     * @param {HTMLElement} importButton - The import button to enable/disable
     */
    async loadDriveFiles(fileListElement, importButton) {
        try {
            // Clear file list
            fileListElement.innerHTML = '<div class="drive-loading"><i class="fas fa-spinner fa-spin"></i> Loading files...</div>';
            
            // Get files from Google Drive
            this.driveFiles = await listDriveFiles();
            
            // Clear loading indicator
            fileListElement.innerHTML = '';
            
            if (this.driveFiles.length === 0) {
                fileListElement.innerHTML = '<div class="drive-empty">No image files found in your Google Drive</div>';
                return;
            }
            
            // Create file items
            const selectedFiles = new Set();
            
            this.driveFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'drive-file-item';
                fileItem.dataset.fileId = file.id;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `drive-file-${file.id}`;
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        selectedFiles.add(file.id);
                    } else {
                        selectedFiles.delete(file.id);
                    }
                    
                    // Enable/disable import button
                    if (importButton) {
                        importButton.disabled = selectedFiles.size === 0;
                    }
                });
                
                const label = document.createElement('label');
                label.htmlFor = `drive-file-${file.id}`;
                
                const fileName = document.createElement('span');
                fileName.className = 'drive-file-name';
                fileName.textContent = file.name;
                
                label.appendChild(fileName);
                
                fileItem.appendChild(checkbox);
                fileItem.appendChild(label);
                
                fileListElement.appendChild(fileItem);
            });
        } catch (error) {
            console.error('Error loading Google Drive files:', error);
            fileListElement.innerHTML = `<div class="drive-error">Error loading files: ${error.message}</div>`;
        }
    }
    
    /**
     * Import selected files from Google Drive
     */
    async importSelectedFiles() {
        try {
            // Get selected file IDs
            const selectedCheckboxes = this.container.querySelectorAll('.drive-file-item input[type="checkbox"]:checked');
            const selectedFileIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.closest('.drive-file-item').dataset.fileId);
            
            if (selectedFileIds.length === 0) {
                showNotification('No files selected', 'error');
                return;
            }
            
            // Show loading notification
            showNotification(`Importing ${selectedFileIds.length} files from Google Drive...`, 'info');
            
            // Get selected files
            const selectedFiles = this.driveFiles.filter(file => selectedFileIds.includes(file.id));
            
            // Convert Google Drive files to File objects
            const files = await Promise.all(selectedFiles.map(async file => {
                // In a real implementation, we would download the file content
                // For this demo, we'll create a mock File object
                return new File(
                    [new ArrayBuffer(1024)], // Mock file content
                    file.name,
                    { type: file.mimeType }
                );
            }));
            
            // Add files to the application
            await addFiles(files, this.onFileAdded);
            
            // Show success notification
            showNotification(`Successfully imported ${files.length} files from Google Drive`, 'success');
            
            // Uncheck all checkboxes
            const checkboxes = this.container.querySelectorAll('.drive-file-item input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Disable import button
            const importButton = this.container.querySelector('.drive-import-btn');
            if (importButton) {
                importButton.disabled = true;
            }
        } catch (error) {
            console.error('Error importing files from Google Drive:', error);
            showNotification(`Error importing files: ${error.message}`, 'error');
        }
    }
}
