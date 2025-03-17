/**
 * Bar Receipt Tip Extractor
 * Main application entry point
 */
import config from './config.js';
import FileUploader from './components/fileUploader.js';
import ResultsTable from './components/resultsTable.js';
import OrganizerGrid from './components/organizerGrid.js';
import Slideshow from './components/slideshow.js';
import { processImages, getProcessedImages, generateSampleImages } from './services/processingService.js';
import { copyJsonToClipboard } from './services/exportService.js';
import { updateProgressBar } from './utils/uiUtils.js';

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
    
    const resultsTable = new ResultsTable({
        tableBodyId: 'tableBody',
        sortFieldId: 'sortField',
        sortOrderId: 'sortOrder',
        sortBtnId: 'sortBtn',
        exportCsvBtnId: 'exportCsvBtn'
    });
    
    const organizerGrid = new OrganizerGrid({
        gridId: 'organizedGrid',
        filterFieldId: 'filterField',
        filterValueId: 'filterValue',
        applyFilterBtnId: 'applyFilterBtn',
        clearFilterBtnId: 'clearFilterBtn',
        gridViewBtnId: 'gridViewBtn',
        slideshowViewBtnId: 'slideshowViewBtn'
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
