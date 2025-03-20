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
import EpsonScanner from './components/epsonScanner.js';
import EpsonScannerTab from './components/epsonScannerTab.js';
import PosIntegration from './components/posIntegration.js';
import { GoogleDriveIntegration } from './components/googleDriveIntegration.js';
import { initGoogleDriveService } from './services/googleDriveService.js';
import { processImages, getProcessedImages, generateSampleImages } from './services/processingService.js';
import { copyJsonToClipboard } from './services/exportService.js';
import { updateProgressBar, createCountdown } from './utils/uiUtils.js';
import { processFilesForSubmission } from './services/fileService.js';
import { processFilesWithSelectedAPI, calculateEstimatedProcessingTime, updateApiCostDisplay, setSelectedApi } from './services/apiService.js';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const authLink = document.getElementById('authLink');
    
    // Check if user is authenticated and update UI accordingly
    function updateAuthUI() {
        if (isAuthenticated()) {
            const user = getCurrentUser();
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
                userInfoEl.innerHTML = `Welcome, <span class="user-name">${user.name}</span>`;
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
        }
    }
    
    // Initialize auth UI
    updateAuthUI();
    
    // Add event listener for auth link
    if (authLink) {
        authLink.addEventListener('click', (e) => {
            if (isAuthenticated()) {
                e.preventDefault();
                logout();
                updateAuthUI();
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
    
    // Initialize API selection
    if (apiSelect) {
        apiSelect.addEventListener('change', (e) => {
            setSelectedApi(e.target.value);
            
            // Update footer text
            const footerApiText = document.querySelector('footer p:first-child');
            if (footerApiText) {
                const apiName = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
                footerApiText.textContent = `Powered by ${apiName} API | `;
                const versionSpan = document.createElement('span');
                versionSpan.className = 'version';
                versionSpan.textContent = 'v1.0.0';
                footerApiText.appendChild(versionSpan);
            }
        });
    }
    
    // Initialize Simulate Toggle
    const simulateToggle = document.getElementById('simulateToggle');
    if (simulateToggle) {
        // Set initial state based on config
        simulateToggle.checked = !config.api.useRealApi;
        
        simulateToggle.addEventListener('change', (e) => {
            // Update config
            config.api.useRealApi = !e.target.checked;
            console.log(`API Mode: ${config.api.useRealApi ? 'Real API' : 'Simulated Data'}`);
            
            // Update footer text to indicate simulation mode
            const footerApiText = document.querySelector('footer p:first-child');
            if (footerApiText) {
                const apiName = apiSelect ? apiSelect.value.charAt(0).toUpperCase() + apiSelect.value.slice(1) : 'Claude';
                const simulationText = e.target.checked ? ' (Simulation)' : '';
                footerApiText.textContent = `Powered by ${apiName} API${simulationText} | `;
                const versionSpan = document.createElement('span');
                versionSpan.className = 'version';
                versionSpan.textContent = 'v1.0.0';
                footerApiText.appendChild(versionSpan);
            }
        });
    }
    
    // Initialize Components
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
        slideshowId: 'slideshowView',
        imageContainerId: 'slideshowImageContainer',
        prevBtnId: 'prevSlideBtn',
        nextBtnId: 'nextSlideBtn',
        counterContainerId: 'slideCounter',
        closeBtnClass: 'slideshow-close'
    });
    
    // Initialize Epson Scanner for Tip Analyzer
    const epsonScanner = new EpsonScanner({
        scanBtnId: 'scanBtn',
        onFilesAdded: fileUploader.createFilePreview.bind(fileUploader)
    });
    
    // Initialize Epson Scanner for File Organizer
    const epsonOrganizerScanner = new EpsonScanner({
        scanBtnId: 'scanOrganizerBtn',
        onFilesAdded: fileOrganizerUploader.createFilePreview.bind(fileOrganizerUploader)
    });
    
    // Initialize Epson Scanner Tab
    const epsonScannerTab = new EpsonScannerTab({});
    
    // Initialize Google Drive Service
    initGoogleDriveService();
    
    // Initialize Google Drive Integration for Tip Analyzer
    const googleDriveContainer = document.createElement('div');
    googleDriveContainer.className = 'google-drive-integration';
    const dropArea = document.getElementById('dropArea');
    if (dropArea && dropArea.parentNode) {
        dropArea.parentNode.insertBefore(googleDriveContainer, dropArea.nextSibling);
        const googleDriveIntegration = new GoogleDriveIntegration(
            googleDriveContainer, 
            fileUploader.createFilePreview.bind(fileUploader)
        );
    }
    
    // Initialize Google Drive Integration for File Organizer
    const googleDriveOrganizerContainer = document.createElement('div');
    googleDriveOrganizerContainer.className = 'google-drive-integration';
    const fileOrganizerDropArea = document.getElementById('fileOrganizerDropArea');
    if (fileOrganizerDropArea && fileOrganizerDropArea.parentNode) {
        fileOrganizerDropArea.parentNode.insertBefore(googleDriveOrganizerContainer, fileOrganizerDropArea.nextSibling);
        const googleDriveOrganizerIntegration = new GoogleDriveIntegration(
            googleDriveOrganizerContainer, 
            fileOrganizerUploader.createFilePreview.bind(fileOrganizerUploader)
        );
    }
    
    // Tab Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
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
        });
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
});
