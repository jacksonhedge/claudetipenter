/**
 * App Initialization
 * Handles phased initialization of application components to prevent
 * "elements not found" errors and ensure components load in the right order
 */

// Import required components
import FileUploader from './components/fileUploader.js';
import EpsonScanner from './components/epsonScanner.js';
import { initGoogleDriveService } from './services/googleDriveService.js';
import ProfileModal from './components/profileModal.js';
import { isAuthenticated, getCurrentUser } from './services/authService.js';
import { showNotification } from './utils/uiUtils.js';
import { initializeFirebase } from './firebase-init.js';

/**
 * Initialize the app in phases to ensure component dependencies are met
 */
export async function initializeApp() {
    console.log('🚀 Starting application initialization...');

    try {
        // Phase 0: Initialize Firebase and ensure collections exist
        console.log('🔍 Phase 0: Initializing Firebase...');
        await initializeFirebase();
        
        // Phase 1: Initialize core authentication and user profile
        console.log('🔍 Phase 1: Initializing authentication...');
        await initializeAuth();
        
        // Phase 2: Initialize main UI components
        console.log('🔍 Phase 2: Initializing UI components...');
        await initializeUIComponents();
        
        // Phase 3: Initialize optional components
        console.log('🔍 Phase 3: Initializing optional components...');
        await initializeOptionalComponents();
        
        console.log('✅ Application initialization complete');
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
        showNotification('There was an error initializing the application. Some features may not work properly.', 'error', 5000);
    }
}

/**
 * Initialize authentication and user profile
 */
async function initializeAuth() {
    console.log('🔑 Initializing authentication...');
    
    try {
        // Initialize profile modal
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            const profileModal = new ProfileModal();
            console.log('✅ Profile modal initialized');
        } else {
            console.log('ℹ️ Profile button not found, skipping profile modal initialization');
        }
        
        // Update auth UI based on login status
        await updateAuthUI();
    } catch (error) {
        console.error('❌ Error initializing authentication:', error);
        // Continue initialization even if auth fails
    }
}

/**
 * Update UI elements based on authentication status
 */
async function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    
    if (isAuthenticated()) {
        try {
            const user = await getCurrentUser();
            
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.add('logout');
                authLink.href = '#';
                
                // Create user info element if it doesn't exist
                let userInfoEl = document.querySelector('.user-info');
                if (!userInfoEl) {
                    userInfoEl = document.createElement('div');
                    userInfoEl.className = 'user-info';
                    authLink.parentNode.insertBefore(userInfoEl, authLink);
                }
                
                // Update user info
                if (user && user.name) {
                    userInfoEl.innerHTML = `Welcome, <span class="user-name">${user.name}</span>`;
                } else {
                    userInfoEl.innerHTML = `Welcome, <span class="user-name">User</span>`;
                }
            }
            
            console.log('✅ Auth UI updated for authenticated user');
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            // Fallback to default user info
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.add('logout');
                authLink.href = '#';
                
                let userInfoEl = document.querySelector('.user-info');
                if (!userInfoEl) {
                    userInfoEl = document.createElement('div');
                    userInfoEl.className = 'user-info';
                    authLink.parentNode.insertBefore(userInfoEl, authLink);
                }
                
                // Fallback user info
                userInfoEl.innerHTML = `Welcome, <span class="user-name">User</span>`;
            }
            
            console.log('⚠️ Using fallback auth UI due to error');
        }
    } else {
        if (authLink) {
            authLink.textContent = 'Login';
            authLink.classList.remove('logout');
            authLink.href = 'login.html';
            
            // Remove user info element if it exists
            const userInfoEl = document.querySelector('.user-info');
            if (userInfoEl) {
                userInfoEl.remove();
            }
        }
        
        console.log('ℹ️ Auth UI updated for non-authenticated user');
    }
}

/**
 * Initialize main UI components with error handling
 */
async function initializeUIComponents() {
    console.log('🖥️ Initializing UI components...');
    
    // Initialize File Uploader with fallback
    try {
        initializeFileUploader();
    } catch (error) {
        console.error('❌ Error initializing File Uploader:', error);
    }
    
    // Initialize Google Drive Integration
    try {
        initGoogleDriveService();
        console.log('✅ Google Drive Service initialized');
    } catch (error) {
        console.error('❌ Error initializing Google Drive Service:', error);
    }
}

/**
 * Initialize File Uploader with retry and polling for DOM elements
 */
function initializeFileUploader() {
    // Initialize global app components container if it doesn't exist
    if (!window.appComponents) {
        window.appComponents = {};
    }
    
    // Try to find required elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const processBtn = document.getElementById('processBtn');
    
    // Check if required elements exist
    if (dropArea && fileInput && fileList) {
        // All elements found, initialize FileUploader
        const fileUploader = new FileUploader({
            dropAreaId: 'dropArea',
            fileInputId: 'fileInput',
            fileListId: 'fileList',
            fileCountId: 'fileCount',
            processBtnId: 'processBtn',
            onFileCountChange: (count) => {
                // Update the process button text based on file count
                if (processBtn) {
                    processBtn.textContent = `Process ${count} Image${count !== 1 ? 's' : ''}`;
                }
            }
        });
        
        // Store the fileUploader instance in the global appComponents object
        window.appComponents.fileUploader = fileUploader;
        
        console.log('✅ File Uploader initialized and stored in window.appComponents.fileUploader');
        
        // Initialize Epson Scanner with the FileUploader instance
        initializeEpsonScanner(fileUploader);
        
        return fileUploader;
    } else {
        // Elements not found, log which ones are missing
        const missing = [];
        if (!dropArea) missing.push('dropArea');
        if (!fileInput) missing.push('fileInput');
        if (!fileList) missing.push('fileList');
        
        console.warn(`⚠️ Some required elements for FileUploader not found: ${missing.join(', ')}`);
        console.warn('⚠️ FileUploader initialization skipped');
        
        return null;
    }
}

/**
 * Initialize Epson Scanner with better error handling
 */
function initializeEpsonScanner(fileUploader) {
    // Check if scan button exists
    const scanBtn = document.getElementById('scanBtn');
    
    if (scanBtn && fileUploader) {
        try {
            // Initialize Epson Scanner
            const epsonScanner = new EpsonScanner({
                scanBtnId: 'scanBtn',
                onFilesAdded: fileUploader.createFilePreview.bind(fileUploader)
            });
            
            console.log('✅ Epson Scanner initialized');
        } catch (error) {
            console.error('❌ Error initializing Epson Scanner:', error);
        }
    } else {
        console.warn('⚠️ Scan button or FileUploader not found, skipping Epson Scanner initialization');
    }
}

/**
 * Initialize optional components
 */
async function initializeOptionalComponents() {
    console.log('🧩 Initializing optional components...');
    
    // Any additional components that are nice-to-have but not critical
    // These will be initialized last and failures won't block the app
}

// Export a function to explicitly start initialization
export function startAppInitialization() {
    // Wait for DOM content to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
        console.log('⏳ Waiting for DOMContentLoaded event...');
    } else {
        // DOM already loaded, initialize immediately
        initializeApp();
    }
}
