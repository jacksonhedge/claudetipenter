/**
 * Bar Receipt Tip Extractor
 * Main application entry point
 */
import config from './config.js';
import FileUploader from './components/fileUploader.js';
import ResultsTable from './components/resultsTable.js';
import OrganizerResultsTable from './components/organizerResultsTable.js';
import OrganizerGrid from './components/organizerGrid.js';
import OrganizerGridNoTip from './components/organizerGridNoTip.js';
import Slideshow from './components/slideshow.js';
import { processImages, getProcessedImages, generateSampleImages } from './services/processingService.js';
import { copyJsonToClipboard } from './services/exportService.js';
import { updateProgressBar, createCountdown } from './utils/uiUtils.js';
import { processFilesForSubmission } from './services/fileService.js';
import { processFilesWithClaudeAPI, calculateEstimatedProcessingTime, updateApiCostDisplay } from './services/apiService.js';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // DOM Elements - Results
    const resultsSection = document.getElementById('resultsSection');
    const progressBar = document.getElementById('progressBar');
    const countdownTimer = document.getElementById('countdownTimer');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('copyBtn');
    const processBtn = document.getElementById('processBtn');
    const organizeBtn = document.getElementById('organizeBtn');
    
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
                            jsonOutput.textContent = JSON.stringify(data, null, 2);
                        }
                        
                        // Populate table view
                        resultsTable.populateTable(data);
                        
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
                    
                    // Process with Claude API (file organizer mode)
                    updateProgressBar(organizerProgressBar, 20);
                    const result = await processFilesWithClaudeAPI(base64Files);
                    
                    // Format results
                    updateProgressBar(organizerProgressBar, 90);
                    
                    // Update API cost display if available
                    if (result.api_cost && result.api_cost.total_cost) {
                        updateApiCostDisplay(result.api_cost.total_cost);
                    }
                    
                    // Display JSON output
                    if (organizerJsonOutput) {
                        organizerJsonOutput.textContent = JSON.stringify(result, null, 2);
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
