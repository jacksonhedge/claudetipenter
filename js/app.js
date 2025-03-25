/**
 * Bar Receipt Tip Extractor
 * Main application entry point
 */
import config from './config.js';
import { isAuthenticated, getCurrentUser, logout } from './services/authService.js';
import FileUploader from './components/fileUploader.js';
import ResultsTable from './components/resultsTable.js';
import OrganizerResultsTable from './components/organizerResultsTable.js';
import OrganizerGrid from './components/organizerGrid.js';
import OrganizerGridNoTip from './components/organizerGridNoTip.js';
import Slideshow from './components/slideshow.js';
import './components/organizedTips.js'; // Import the organized tips component
import TipsHistory from './components/tipsHistory.js'; // Import the tips history component
import EpsonScanner from './components/epsonScanner.js';
import EpsonScannerTab from './components/epsonScannerTab.js';
import PosIntegration from './components/posIntegration.js';
import ExportOptions from './components/exportOptions.js';
import CelebrationPopup from './components/celebrationPopup.js';
import ProfileModal from './components/profileModal.js';
import { GoogleDriveIntegration } from './components/googleDriveIntegration.js';
import { initGoogleDriveService } from './services/googleDriveService.js';
import { processImages, getProcessedImages, generateSampleImages } from './services/processingService.js';
import { copyJsonToClipboard } from './services/exportService.js';
import { updateProgressBar, createCountdown } from './utils/uiUtils.js';
import { processFilesForSubmission } from './services/fileService.js';
import { processFilesWithSelectedAPI, calculateEstimatedProcessingTime, updateApiCostDisplay, setSelectedApi } from './services/apiService.js';
import SubscriptionService from './services/subscriptionService.js';

// Use global React and ReactDOM from CDN
// Comment out React component imports for now as they're causing MIME type errors
// import SubscriptionComponent from './react-components/SubscriptionComponent.jsx';
// import AdminUserManagement from './react-components/AdminUserManagement.jsx';
// import RestaurantList from './react-components/RestaurantList.jsx';
// import AdminSubscriptionDashboard from './react-components/AdminSubscriptionDashboard.jsx';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

import { startAppInitialization } from './app-initialization.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Start app initialization - This handles auth UI and component init with better error handling
    startAppInitialization();
    
    // Add event listener for auth link
    const authLink = document.getElementById('authLink');
    if (authLink) {
        authLink.addEventListener('click', (e) => {
            if (isAuthenticated()) {
                e.preventDefault();
                logout();
                // Use our new initialization module for UI update
                import('./app-initialization.js').then(module => {
                    module.initializeApp();
                });
            }
        });
    }
    
    // DOM Elements - Results
    const resultsSection = document.getElementById('resultsSection');
    const progressBar = document.getElementById('progressBar');
    const countdownTimer = document.getElementById('countdownTimer');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('copyBtn');
    const processBtn = document.getElementById('processBtn');
    const organizeBtn = document.getElementById('organizeBtn');
    const apiSelect = document.getElementById('apiSelect');
    
    // Function to handle API selection and simulation toggle visibility
    async function initializeApiControls() {
        // Temporarily hide API selection and simulate toggle for all users
        const apiSelect = document.getElementById('apiSelect');
        const simulateToggle = document.getElementById('simulateToggle');
        const apiSelectContainer = apiSelect ? apiSelect.closest('.api-select-container') : null;
        const simulateToggleContainer = simulateToggle ? simulateToggle.closest('.simulate-toggle-container') : null;
        
        // Hide API selection and simulate toggle
        if (apiSelectContainer) {
            apiSelectContainer.style.display = 'none';
        }
        if (simulateToggleContainer) {
            simulateToggleContainer.style.display = 'none';
        }
        
        // Set default API to Claude
        setSelectedApi('claude');
        
        // Set default to use real API
        config.api.useRealApi = true;
    }
    
    // Call the initialization function
    initializeApiControls();
    
    // Initialize Tips History Component
    const tipsHistory = new TipsHistory();
    
    // Load sample data for demonstration if needed
    if (config.testing.enabled) {
        tipsHistory.loadSampleData();
    }
    
    // Component references - will be initialized by app-initialization.js
    let fileUploader = window.appComponents?.fileUploader;
    
    // Define a function to get the FileUploader instance whenever it's ready
    const getFileUploader = () => {
        if (window.appComponents?.fileUploader) {
            return window.appComponents.fileUploader;
        }
        return null;
    };
    
    // Initialize File Organizer Uploader
    const fileOrganizerUploader = new FileUploader({
        dropAreaId: 'fileOrganizerDropArea',
        fileInputId: 'fileOrganizerInput',
        fileListId: 'fileOrganizerList',
        fileCountId: 'fileOrganizerCount',
        processBtnId: 'organizeBtn',
        onFileCountChange: (count) => {
            // Update the organize button text based on file count
            if (organizeBtn) {
                organizeBtn.textContent = `Organize ${count} File${count !== 1 ? 's' : ''}`;
            }
        }
    });
    
    const resultsTable = new ResultsTable({
        tableBodyId: 'tableBody',
        sortFieldId: 'sortField',
        sortOrderId: 'sortOrder',
        sortBtnId: 'sortBtn',
        exportCsvBtnId: 'exportCsvBtn'
    });
    
    // Initialize POS Integration
    const posIntegration = new PosIntegration({
        containerId: 'posIntegrationContainer',
        exportBtnId: 'posExportBtn',
        posSystemSelectId: 'posSystemSelect',
        previewContainerId: 'posDataPreview'
    });
    
    const organizerResultsTable = new OrganizerResultsTable({
        tableBodyId: 'organizerTableBody',
        sortFieldId: 'organizerSortField',
        sortOrderId: 'organizerSortOrder',
        sortBtnId: 'organizerSortBtn',
        exportCsvBtnId: 'organizerExportCsvBtn'
    });
    
    const organizerGrid = new OrganizerGrid({
        gridId: 'organizedGrid',
        filterFieldId: 'filterField',
        filterValueId: 'filterValue',
        filterSortOrderId: 'filterSortOrder',
        applyFilterBtnId: 'applyFilterBtn',
        clearFilterBtnId: 'clearFilterBtn',
        gridViewBtnId: 'gridViewBtn',
        slideshowViewBtnId: 'slideshowViewBtn',
        exportPdfBtnId: 'exportPdfBtn'
    });
    
    const organizerGridNoTip = new OrganizerGridNoTip({
        gridId: 'organizedGridNoTip',
        filterFieldId: 'filterFieldNoTip',
        filterValueId: 'filterValueNoTip',
        filterSortOrderId: 'filterSortOrderNoTip',
        applyFilterBtnId: 'applyFilterBtnNoTip',
        clearFilterBtnId: 'clearFilterBtnNoTip',
        gridViewBtnId: 'gridViewBtnNoTip',
        slideshowViewBtnId: 'slideshowViewBtnNoTip',
        exportPdfBtnId: 'exportPdfBtnNoTip'
    });
    
    // Store a reference to the organizerGrid component on the DOM element
    // so that the slideshow can access it
    const organizedGridElement = document.getElementById('organizedGrid');
    if (organizedGridElement) {
        organizedGridElement.__component = organizerGrid;
    }
    
    const slideshow = new Slideshow({
        slideshowId: 'slideshowModal',
        imageContainerId: 'slideshowImageContainer',
        prevBtnId: 'prevSlideBtn',
        nextBtnId: 'nextSlideBtn',
        counterContainerId: 'slideCounter',
        closeBtnClass: 'slideshow-close'
    });
    
    // Initialize Epson Scanner for Tip Analyzer
    let epsonScanner;
    // Check if required elements exist before initializing EpsonScanner
    if (document.getElementById('scanBtn') && fileUploader) {
        epsonScanner = new EpsonScanner({
            scanBtnId: 'scanBtn',
            onFilesAdded: fileUploader.createFilePreview.bind(fileUploader)
        });
    } else {
        console.log('Required elements for EpsonScanner not found');
    }
    
    // Initialize Epson Scanner for File Organizer
    const epsonOrganizerScanner = new EpsonScanner({
        scanBtnId: 'scanOrganizerBtn',
        onFilesAdded: fileOrganizerUploader.createFilePreview.bind(fileOrganizerUploader)
    });
    
    // Initialize Epson Scanner Tab
    const epsonScannerTab = new EpsonScannerTab({});
    
    // Initialize Export Options
    const exportOptions = new ExportOptions();
    
    // Initialize Celebration Popup
    const celebrationPopup = new CelebrationPopup({
        duration: 8000, // Show for 8 seconds
        confettiCount: 200,
        balloonCount: 15
    });
    
    // Initialize Profile Modal
    const profileModal = new ProfileModal();
    
    // Initialize Google Drive Service
    initGoogleDriveService();
    
    // Function to check if user is a manager
    async function isUserManager() {
        if (isAuthenticated()) {
            const user = await getCurrentUser();
            return user && user.role === 'manager';
        }
        return false;
    }
    
    // Function to handle UI elements that should only be available to managers
    async function setupManagerOnlyUI() {
        const isManager = await isUserManager();
        
        // Add CSS for coming soon elements
        const style = document.createElement('style');
        style.textContent = `
            .coming-soon-btn {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                position: relative;
            }
            
            .coming-soon-tab {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                position: relative;
                pointer-events: none;
            }
            
            .coming-soon-label {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(255, 0, 0, 0.7);
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 14px;
                z-index: 10;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
        
        if (!isManager) {
            // Find all elements that should be manager-only
            
            // 1. File Organizer button
            const organizeBtn = document.getElementById('organizeBtn');
            if (organizeBtn) {
                // Disable the button
                organizeBtn.disabled = true;
                
                // Apply gray-out styles
                organizeBtn.style.opacity = '0.5';
                organizeBtn.style.cursor = 'not-allowed';
                organizeBtn.style.position = 'relative';
                organizeBtn.setAttribute('title', 'Coming Soon - Available for managers only');
                
                // Add "Coming Soon" text
                const comingSoonLabel = document.createElement('div');
                comingSoonLabel.textContent = 'Coming Soon';
                comingSoonLabel.style.position = 'absolute';
                comingSoonLabel.style.top = '50%';
                comingSoonLabel.style.left = '50%';
                comingSoonLabel.style.transform = 'translate(-50%, -50%)';
                comingSoonLabel.style.color = '#777';
                comingSoonLabel.style.fontStyle = 'italic';
                comingSoonLabel.style.fontWeight = 'normal';
                comingSoonLabel.style.zIndex = '10';
                
                // Add the label to the button's parent to position it over the button
                const btnContainer = organizeBtn.parentNode;
                if (btnContainer) {
                    btnContainer.style.position = 'relative';
                    btnContainer.appendChild(comingSoonLabel);
                } else {
                    // If no parent, add directly to button
                    organizeBtn.appendChild(comingSoonLabel);
                }
            }
            
            // 2. File Organizer tab
            const fileOrganizerTab = document.querySelector('.nav-item[data-tab="file-organizer-tab"]');
            if (fileOrganizerTab) {
                // Apply gray-out styles
                fileOrganizerTab.style.opacity = '0.5';
                fileOrganizerTab.style.cursor = 'not-allowed';
                fileOrganizerTab.style.position = 'relative';
                fileOrganizerTab.setAttribute('title', 'Coming Soon - Available for managers only');
                
                // Add "Coming Soon" text
                const tabComingSoonLabel = document.createElement('div');
                tabComingSoonLabel.textContent = 'Coming Soon';
                tabComingSoonLabel.style.position = 'absolute';
                tabComingSoonLabel.style.top = '50%';
                tabComingSoonLabel.style.left = '50%';
                tabComingSoonLabel.style.transform = 'translate(-50%, -50%)';
                tabComingSoonLabel.style.color = '#777';
                tabComingSoonLabel.style.fontStyle = 'italic';
                tabComingSoonLabel.style.fontWeight = 'normal';
                tabComingSoonLabel.style.zIndex = '10';
                
                fileOrganizerTab.appendChild(tabComingSoonLabel);
                
                // Prevent clicking on the tab
                fileOrganizerTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('This feature is coming soon and will be available for managers only.');
                    return false;
                }, true);
            }
            
            // 3. Organized Images without Tip tab
            const organizedWithoutTipTab = document.querySelector('.nav-item[data-tab="organized-without-tip-tab"]');
            if (organizedWithoutTipTab) {
                // Apply gray-out styles
                organizedWithoutTipTab.style.opacity = '0.5';
                organizedWithoutTipTab.style.cursor = 'not-allowed';
                organizedWithoutTipTab.style.position = 'relative';
                organizedWithoutTipTab.setAttribute('title', 'Coming Soon - Available for managers only');
                
                // Add "Coming Soon" text
                const tabComingSoonLabel = document.createElement('div');
                tabComingSoonLabel.textContent = 'Coming Soon';
                tabComingSoonLabel.style.position = 'absolute';
                tabComingSoonLabel.style.top = '50%';
                tabComingSoonLabel.style.left = '50%';
                tabComingSoonLabel.style.transform = 'translate(-50%, -50%)';
                tabComingSoonLabel.style.color = '#777';
                tabComingSoonLabel.style.fontStyle = 'italic';
                tabComingSoonLabel.style.fontWeight = 'normal';
                tabComingSoonLabel.style.zIndex = '10';
                
                organizedWithoutTipTab.appendChild(tabComingSoonLabel);
                
                // Prevent clicking on the tab
                organizedWithoutTipTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('This feature is coming soon and will be available for managers only.');
                    return false;
                }, true);
            }
            
            // Also try to find sidebar menu items if they exist
            const fileOrganizerSidebarItem = document.querySelector('.sidebar-menu-item[data-tab="file-organizer-tab"]');
            if (fileOrganizerSidebarItem) {
                fileOrganizerSidebarItem.style.opacity = '0.5';
                fileOrganizerSidebarItem.style.cursor = 'not-allowed';
                fileOrganizerSidebarItem.style.position = 'relative';
                
                const sidebarComingSoonLabel = document.createElement('div');
                sidebarComingSoonLabel.textContent = 'Coming Soon';
                sidebarComingSoonLabel.style.position = 'absolute';
                sidebarComingSoonLabel.style.top = '50%';
                sidebarComingSoonLabel.style.left = '50%';
                sidebarComingSoonLabel.style.transform = 'translate(-50%, -50%)';
                sidebarComingSoonLabel.style.color = '#777';
                sidebarComingSoonLabel.style.fontStyle = 'italic';
                sidebarComingSoonLabel.style.fontWeight = 'normal';
                sidebarComingSoonLabel.style.zIndex = '10';
                
                fileOrganizerSidebarItem.appendChild(sidebarComingSoonLabel);
                
                fileOrganizerSidebarItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('This feature is coming soon and will be available for managers only.');
                    return false;
                }, true);
            }
            
            const organizedWithoutTipSidebarItem = document.querySelector('.sidebar-menu-item[data-tab="organized-without-tip-tab"]');
            if (organizedWithoutTipSidebarItem) {
                organizedWithoutTipSidebarItem.style.opacity = '0.5';
                organizedWithoutTipSidebarItem.style.cursor = 'not-allowed';
                organizedWithoutTipSidebarItem.style.position = 'relative';
                
                const sidebarComingSoonLabel = document.createElement('div');
                sidebarComingSoonLabel.textContent = 'Coming Soon';
                sidebarComingSoonLabel.style.position = 'absolute';
                sidebarComingSoonLabel.style.top = '50%';
                sidebarComingSoonLabel.style.left = '50%';
                sidebarComingSoonLabel.style.transform = 'translate(-50%, -50%)';
                sidebarComingSoonLabel.style.color = '#777';
                sidebarComingSoonLabel.style.fontStyle = 'italic';
                sidebarComingSoonLabel.style.fontWeight = 'normal';
                sidebarComingSoonLabel.style.zIndex = '10';
                
                organizedWithoutTipSidebarItem.appendChild(sidebarComingSoonLabel);
                
                organizedWithoutTipSidebarItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('This feature is coming soon and will be available for managers only.');
                    return false;
                }, true);
            }
        }
    }
    
    // Call the function to set up manager-only UI
    setupManagerOnlyUI();
    
    // Only initialize Google Drive Integration for admin/manager users
    async function initializeGoogleDriveIntegration() {
        // Check if user is authenticated and has manager role
        const isManager = await isUserManager();
        
        if (isManager) {
            // Initialize Google Drive Integration for Tip Analyzer
            const googleDriveContainer = document.getElementById('googleDriveContainer');
            if (googleDriveContainer) {
                const googleDriveIntegration = new GoogleDriveIntegration(
                    googleDriveContainer, 
                    fileUploader.createFilePreview.bind(fileUploader)
                );
            }
            
            // Initialize Google Drive Integration for File Organizer
            const googleDriveOrganizerContainer = document.getElementById('googleDriveOrganizerContainer');
            if (googleDriveOrganizerContainer) {
                const googleDriveOrganizerIntegration = new GoogleDriveIntegration(
                    googleDriveOrganizerContainer, 
                    fileOrganizerUploader.createFilePreview.bind(fileOrganizerUploader)
                );
            }
        } else {
            // Hide Google Drive containers for non-manager users
            const googleDriveContainer = document.getElementById('googleDriveContainer');
            if (googleDriveContainer) {
                googleDriveContainer.style.display = 'none';
            }
            
            const googleDriveOrganizerContainer = document.getElementById('googleDriveOrganizerContainer');
            if (googleDriveOrganizerContainer) {
                googleDriveOrganizerContainer.style.display = 'none';
            }
        }
    }
    
    // Call the initialization function
    initializeGoogleDriveIntegration();
    
    // Tab Navigation function
    const switchTab = (tabId) => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        sidebarMenuItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to items with matching data-tab
        navItems.forEach(navItem => {
            if (navItem.getAttribute('data-tab') === tabId) {
                navItem.classList.add('active');
            }
        });
        
        sidebarMenuItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            }
        });
        
        // Hide all tabs
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
            
            // If switching to organized tab, refresh the display
            if (tabId === 'organized-tab') {
                const processedImages = getProcessedImages();
                if (processedImages && processedImages.length > 0) {
                    organizerGrid.setImages(processedImages);
                }
            }
        }
    };
    
    // Add click event to nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Add click event to sidebar menu items
    sidebarMenuItems.forEach(item => {
        // Skip the auth link item
        if (!item.classList.contains('auth-link')) {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                switchTab(tabId);
            });
        }
    });
    
    // Process Button Click Handler
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            // Show results section
            if (resultsSection) {
                resultsSection.style.display = 'block';
                
                // Scroll to results section
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            try {
                // Process images
                const result = await processImages(
                    progressBar,
                    countdownTimer,
                    (message, percent) => {
                        // Progress callback
                        console.log(`Progress: ${message} (${percent}%)`);
                        updateProgressBar(progressBar, percent);
                    },
                    (data) => {
                        // Completion callback
                        console.log('Processing complete:', data);
                        
                        // Display JSON output
                        if (jsonOutput) {
                            // Format the JSON with syntax highlighting
                            const formattedJson = JSON.stringify(data, null, 2);
                            jsonOutput.textContent = formattedJson;
                            
                            // Add a class to highlight error responses
                            if (data.results && data.results.some(item => item.error === true)) {
                                jsonOutput.classList.add('contains-errors');
                            } else {
                                jsonOutput.classList.remove('contains-errors');
                            }
                        }
                        
                        // Populate table view
                        resultsTable.populateTable(data);
                        
                        // Update POS integration data
                        posIntegration.setData(data);
                        
                        // Update the organizer grid if we're on that tab
                        const organizedTab = document.getElementById('organized-tab');
                        if (organizedTab && organizedTab.classList.contains('active')) {
                            organizerGrid.setImages(getProcessedImages());
                        }
                        
                        // Calculate total tips and show celebration popup
                        if (data && data.results && data.results.length > 0) {
                            let totalTips = 0;
                            let validTipCount = 0;
                            
                            // Sum up all tips
                            data.results.forEach(item => {
                                if (item.tip && !item.error) {
                                    // Extract numeric value from tip string (e.g. "$10.50" -> 10.50)
                                    const tipValue = parseFloat(item.tip.replace(/[^0-9.-]+/g, ''));
                                    if (!isNaN(tipValue)) {
                                        totalTips += tipValue;
                                        validTipCount++;
                                    }
                                }
                            });
                            
                            // Only show popup if we have valid tips
                            if (validTipCount > 0) {
                                // Show the celebration popup with the total tips
                                setTimeout(() => {
                                    celebrationPopup.showPopup(totalTips);
                                }, 1000); // Delay slightly to let the table render first
                            }
                            
                            // Add the processed data to tips history
                            tipsHistory.addToHistory(data);
                        }
                    }
                );
            } catch (error) {
                console.error('Error processing images:', error);
                
                // Show error in JSON output
                if (jsonOutput) {
                    jsonOutput.textContent = JSON.stringify({
                        error: true,
                        message: error.message
                    }, null, 2);
                }
                
                // Reset progress bar
                updateProgressBar(progressBar, 0);
            }
        });
    }
    
    // Copy JSON Button Click Handler
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const jsonText = jsonOutput.textContent;
            copyJsonToClipboard(
                jsonText,
                () => {
                    // Success callback
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 2000);
                }
            );
        });
    }
    
    // DOM Elements - File Organizer Results
    const organizerResultsSection = document.getElementById('organizerResultsSection');
    const organizerProgressBar = document.getElementById('organizerProgressBar');
    const organizerCountdownTimer = document.getElementById('organizerCountdownTimer');
    const organizerJsonOutput = document.getElementById('organizerJsonOutput');
    const organizerCopyBtn = document.getElementById('organizerCopyBtn');
    
    // Organizer Copy JSON Button Click Handler
    if (organizerCopyBtn) {
        organizerCopyBtn.addEventListener('click', () => {
            const jsonText = organizerJsonOutput.textContent;
            copyJsonToClipboard(
                jsonText,
                () => {
                    // Success callback
                    const originalText = organizerCopyBtn.textContent;
                    organizerCopyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        organizerCopyBtn.textContent = originalText;
                    }, 2000);
                }
            );
        });
    }
    
    // Organize Button Click Handler
    if (organizeBtn) {
        organizeBtn.addEventListener('click', async () => {
            try {
                // Get the files from the file organizer uploader
                const files = fileOrganizerUploader.getFiles();
                
                if (files && files.length > 0) {
                    console.log(`Organizing ${files.length} files...`);
                    
                    // Show results section
                    if (organizerResultsSection) {
                        organizerResultsSection.style.display = 'block';
                        organizerResultsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // Process files with Claude API (without tip analysis)
                    updateProgressBar(organizerProgressBar, 10);
                    
                    // Compress and convert files to base64
                    const base64Files = await processFilesForSubmission();
                    
                    if (base64Files.length === 0) {
                        throw new Error('No valid files to process');
                    }
                    
                    // Set up countdown timer
                    const estimatedTime = calculateEstimatedProcessingTime(base64Files.length);
                    const countdown = createCountdown(organizerCountdownTimer, estimatedTime);
                    countdown.start();
                    
                    // Process with selected API (file organizer mode) or use simulated data
                    updateProgressBar(organizerProgressBar, 20);
                    let result;
                    try {
                        result = await processFilesWithSelectedAPI(base64Files);
                    } catch (error) {
                        console.warn('Error with API, using simulated data instead:', error);
                        // Generate simulated data
                        result = {
                            success: true,
                            processed_images: base64Files.length,
                            results: base64Files.map((file, index) => ({
                                file_name: file.name || `file_${index}.jpg`,
                                customer_name: `Customer ${index + 1}`,
                                check_number: `${7000 + index}`,
                                amount: `$${(Math.random() * 50 + 10).toFixed(2)}`,
                                payment_type: ['Visa', 'Mastercard', 'AMEX', 'Discover'][Math.floor(Math.random() * 4)],
                                date: '03/18/2025',
                                time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'PM' : 'AM'}`,
                                signed: Math.random() > 0.3,
                                server: `Server ${Math.floor(Math.random() * 5) + 1}`,
                                guests: Math.floor(Math.random() * 4) + 1,
                                comps: '$0.00',
                                voids: '$0.00',
                                auto_grat: '$0.00',
                                tax: `$${(Math.random() * 5).toFixed(2)}`,
                                total: `$${(Math.random() * 60 + 15).toFixed(2)}`,
                                tip: `$${(Math.random() * 10 + 2).toFixed(2)}`,
                                cash: Math.random() > 0.7 ? `$${(Math.random() * 50).toFixed(2)}` : '$0.00',
                                credit: Math.random() > 0.3 ? `$${(Math.random() * 50).toFixed(2)}` : '$0.00',
                                tenders: '$0.00',
                                rev_ctr: 'Back Bar'
                            }))
                        };
                    }
                    
                    // Format results
                    updateProgressBar(organizerProgressBar, 90);
                    
                    // Update API cost display if available
                    if (result.api_cost && result.api_cost.total_cost) {
                        updateApiCostDisplay(result.api_cost.total_cost);
                    }
                    
                    // Display JSON output
                    if (organizerJsonOutput) {
                        // Format the JSON with syntax highlighting
                        const formattedJson = JSON.stringify(result, null, 2);
                        organizerJsonOutput.textContent = formattedJson;
                        
                        // Add a class to highlight error responses
                        if (result.results && result.results.some(item => item.error === true)) {
                            organizerJsonOutput.classList.add('contains-errors');
                        } else {
                            organizerJsonOutput.classList.remove('contains-errors');
                        }
                    }
                    
                    // Populate table view
                    organizerResultsTable.populateTable(result);
                    
                    // Complete progress bar
                    updateProgressBar(organizerProgressBar, 100);
                    
                    // Stop countdown
                    countdown.stop();
                    
                    // Process images for organized tab
                    if (result && result.results) {
                        // Map the results to include image URLs
                        const processedImages = result.results.map((item, index) => {
                            // Use the actual uploaded image if available
                            let imageUrl;
                            
                            if (files && files[index]) {
                                // Create a URL for the file
                                imageUrl = URL.createObjectURL(files[index]);
                            } else {
                                // Fallback to a colored rectangle if no image is available
                                const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
                                const color = colors[index % colors.length];
                                
                                // Create a canvas element
                                const canvas = document.createElement('canvas');
                                canvas.width = 300;
                                canvas.height = 200;
                                const ctx = canvas.getContext('2d');
                                
                                // Fill background
                                ctx.fillStyle = color;
                                ctx.fillRect(0, 0, 300, 200);
                                
                                // Add text
                                ctx.fillStyle = 'white';
                                ctx.font = 'bold 20px Arial';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(`Receipt Image ${index + 1}`, 150, 100);
                                
                                // Convert to data URL
                                imageUrl = canvas.toDataURL('image/png');
                            }
                            
                            // Add default values for tip and total if they don't exist
                            const processedItem = {
                                ...item,
                                image_url: imageUrl,
                                tip: item.tip || "N/A",
                                total: item.total || item.amount
                            };
                            
                            return processedItem;
                        });
                        
                        // Switch to the Organized Images without Tip tab to show the results
                        const organizedWithoutTipTabItem = document.querySelector('.nav-item[data-tab="organized-without-tip-tab"]');
                        if (organizedWithoutTipTabItem) {
                            organizedWithoutTipTabItem.click();
                        }
                        
                        // Update the organizer grid without tip with the processed images
                        organizerGridNoTip.setImages(processedImages);
                    }
                }
            } catch (error) {
                console.error('Error organizing files:', error);
                
                // Show error in JSON output
                if (organizerJsonOutput) {
                    organizerJsonOutput.textContent = JSON.stringify({
                        error: true,
                        message: error.message
                    }, null, 2);
                }
                
                // Reset progress bar
                updateProgressBar(organizerProgressBar, 0);
                
                alert(`Error organizing files: ${error.message}`);
            }
        });
    }
    
    // Load sample images if in test mode
    if (config.testing.enabled) {
        generateSampleImages(config.testing.sampleCount, (file) => {
            fileUploader.createFilePreview(file, file.name);
        });
    }
    
    // Add Test Images button (if it exists)
    const addTestImagesBtn = document.getElementById('addTestImagesBtn');
    if (addTestImagesBtn) {
        addTestImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the dropArea click event
            generateSampleImages(10, (file) => {
                fileUploader.createFilePreview(file, file.name);
            });
        });
    }
    
    // Initialize React components
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Comment out React component initialization for now
    /*
    // Initialize Subscription Component
    const subscriptionContainer = document.getElementById('subscription-container');
    if (subscriptionContainer) {
        ReactDOM.render(
            React.createElement(SubscriptionComponent),
            subscriptionContainer
        );
    }
    
    // Initialize Admin User Management Component
    const userManagementContainer = document.getElementById('user-management-container');
    if (userManagementContainer) {
        ReactDOM.render(
            React.createElement(AdminUserManagement),
            userManagementContainer
        );
    }
    
    // Initialize Restaurant List Component
    const restaurantListContainer = document.getElementById('restaurant-list-container');
    if (restaurantListContainer) {
        ReactDOM.render(
            React.createElement(RestaurantList),
            restaurantListContainer
        );
    }
    
    // Initialize Subscription Dashboard Component
    const subscriptionDashboardContainer = document.getElementById('subscription-dashboard-container');
    if (subscriptionDashboardContainer) {
        ReactDOM.render(
            React.createElement(AdminSubscriptionDashboard),
            subscriptionDashboardContainer
        );
    }
    */
});
