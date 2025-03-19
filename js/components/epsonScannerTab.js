/**
 * Epson Scanner Tab Component
 * Provides a dedicated interface for Epson scanner integration
 */
import { createElement, showNotification } from '../utils/uiUtils.js';
import { addFiles } from '../services/fileService.js';

export default class EpsonScannerTab {
    /**
     * Initialize the Epson Scanner Tab component
     * @param {Object} options - Configuration options
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.scanButton = document.getElementById('epson-scan-button');
        this.scanForm = document.getElementById('epson-scan-form');
        this.scanStatus = document.getElementById('epson-scan-status');
        this.scanDestinations = document.getElementById('epson-scan-destinations');
        this.scanResolution = document.getElementById('epson-scan-resolution');
        this.scanColorMode = document.getElementById('epson-scan-color-mode');
        this.scanFileFormat = document.getElementById('epson-scan-file-format');
        this.scanTarget = document.getElementById('epson-scan-target');
        this.scanResultsContainer = document.getElementById('epson-scan-results-container');
        this.scanResults = document.getElementById('epson-scan-results');
        
        // Bind methods
        this.handleScanButtonClick = this.handleScanButtonClick.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.getScanDestinations = this.getScanDestinations.bind(this);
        this.startScanJob = this.startScanJob.bind(this);
        this.pollJobStatus = this.pollJobStatus.bind(this);
        this.getScannedImage = this.getScannedImage.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        if (this.scanButton) {
            this.scanButton.addEventListener('click', this.handleScanButtonClick);
        }
        
        if (this.scanForm) {
            this.scanForm.addEventListener('submit', this.handleFormSubmit);
        }
    }
    
    /**
     * Handle scan button click
     * @param {Event} e - The click event
     */
    async handleScanButtonClick(e) {
        e.preventDefault();
        
        try {
            // Update status
            this.updateStatus('Getting scan destinations...');
            
            // Hide form and results
            this.scanForm.style.display = 'none';
            this.scanResultsContainer.style.display = 'none';
            
            // Get scan destinations
            await this.getScanDestinations();
        } catch (error) {
            console.error('Error initializing scan:', error);
            this.updateStatus(`Error: ${error.message}`);
            showNotification('Error initializing scan: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle form submit
     * @param {Event} e - The submit event
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Hide form and show status
            this.scanForm.style.display = 'none';
            this.scanResultsContainer.style.display = 'none';
            
            // Start scan job
            await this.startScanJob();
        } catch (error) {
            console.error('Error starting scan job:', error);
            this.updateStatus(`Error: ${error.message}`);
            showNotification('Error starting scan job: ' + error.message, 'error');
        }
    }
    
    /**
     * Update status message
     * @param {string} message - The status message
     */
    updateStatus(message) {
        if (this.scanStatus) {
            this.scanStatus.textContent = message;
        }
    }
    
    /**
     * Get scan destinations from the server
     */
    async getScanDestinations() {
        try {
            // Get scan destinations from server
            const response = await fetch('/api/epson/scan/destinations');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get scan destinations');
            }
            
            // Store scan destinations
            const destinations = data.destinations || [];
            
            // Clear destination select
            this.scanDestinations.innerHTML = '';
            
            // Add destinations to select
            if (destinations.length === 0) {
                // No destinations found
                throw new Error('No scan destinations found');
            }
            
            // Add destinations to select
            destinations.forEach(dest => {
                const option = createElement('option', { value: dest.id }, dest.name);
                this.scanDestinations.appendChild(option);
            });
            
            // Show form
            this.scanForm.style.display = 'block';
            this.updateStatus('Select scan settings and click "Start Scan"');
        } catch (error) {
            console.error('Error getting scan destinations:', error);
            this.updateStatus(`Error getting scan destinations: ${error.message}`);
            
            // Create a retry button
            const retryButton = createElement('button', {
                className: 'btn btn-primary',
                style: { marginTop: '10px' },
                onClick: this.handleScanButtonClick
            }, 'Retry');
            
            // Add retry button after status
            this.scanStatus.parentNode.insertBefore(retryButton, this.scanStatus.nextSibling);
        }
    }
    
    /**
     * Start a scan job
     */
    async startScanJob() {
        try {
            // Get form values
            const destinationId = this.scanDestinations.value;
            const resolution = this.scanResolution.value;
            const colorMode = this.scanColorMode.value;
            const fileFormat = this.scanFileFormat.value;
            const target = this.scanTarget.value;
            
            // Update status
            this.updateStatus('Starting scan job...');
            
            // Create scan settings
            const scanSettings = {
                destination_id: destinationId,
                resolution: resolution,
                color_mode: colorMode,
                file_format: fileFormat
            };
            
            // Start scan job
            const response = await fetch('/api/epson/scan/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scanSettings)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to start scan job');
            }
            
            // Get job ID
            const jobId = data.job_id;
            
            // Update status
            this.updateStatus(`Scan job started. Job ID: ${jobId}`);
            
            // Poll for job status
            await this.pollJobStatus(jobId, target);
        } catch (error) {
            console.error('Error starting scan job:', error);
            this.updateStatus(`Error starting scan job: ${error.message}`);
            
            // Create a retry button
            const retryButton = createElement('button', {
                className: 'btn btn-primary',
                style: { marginTop: '10px' },
                onClick: () => {
                    // Show form again
                    this.scanForm.style.display = 'block';
                    
                    // Remove retry button
                    if (retryButton.parentNode) {
                        retryButton.parentNode.removeChild(retryButton);
                    }
                    
                    this.updateStatus('Select scan settings and click "Start Scan"');
                }
            }, 'Try Again');
            
            // Add retry button after status
            this.scanStatus.parentNode.insertBefore(retryButton, this.scanStatus.nextSibling);
        }
    }
    
    /**
     * Poll for scan job status
     * @param {string} jobId - The ID of the scan job
     * @param {string} target - The target tab for scanned files
     */
    async pollJobStatus(jobId, target) {
        try {
            // Update status
            this.updateStatus(`Checking scan job status (${jobId})...`);
            
            // Get job status
            const response = await fetch(`/api/epson/scan/jobs/${jobId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get scan job status');
            }
            
            // Update status
            this.updateStatus(`Scan job status: ${data.status}`);
            
            // If job is completed, get the scanned image
            if (data.status === 'completed') {
                // Update status
                this.updateStatus('Scan job completed successfully!');
                
                // Get scanned images
                if (data.images && data.images.length > 0) {
                    // Update status
                    this.updateStatus('Retrieving scanned images...');
                    
                    // Get each image
                    const scannedFiles = [];
                    
                    for (const image of data.images) {
                        try {
                            const file = await this.getScannedImage(jobId, image.id, image.format);
                            scannedFiles.push(file);
                        } catch (error) {
                            console.error(`Error getting scanned image ${image.id}:`, error);
                        }
                    }
                    
                    // Add files to the appropriate uploader
                    if (scannedFiles.length > 0) {
                        // Update status
                        this.updateStatus(`Adding ${scannedFiles.length} scanned image(s) to ${target === 'tip-analyzer' ? 'Tip Analyzer' : 'File Organizer'}...`);
                        
                        // Create a FileList-like object
                        const fileList = {
                            length: scannedFiles.length,
                            item: (index) => scannedFiles[index],
                            [Symbol.iterator]: function* () {
                                for (let i = 0; i < this.length; i++) {
                                    yield this.item(i);
                                }
                            }
                        };
                        
                        // Add files to the appropriate uploader
                        if (target === 'tip-analyzer') {
                            // Get the file uploader for Tip Analyzer
                            const fileInput = document.getElementById('fileInput');
                            if (fileInput) {
                                // Dispatch a custom event with the scanned files
                                const event = new CustomEvent('scannedFiles', { detail: { files: fileList } });
                                fileInput.dispatchEvent(event);
                            }
                            
                            // Show notification before switching tabs
                            showNotification('Scanned files added to Tip Analyzer. Redirecting...', 'success');
                            
                            // Switch to Tip Analyzer tab after a short delay
                            setTimeout(() => {
                                const tipAnalyzerTab = document.querySelector('.nav-item[data-tab="scanner-tab"]');
                                if (tipAnalyzerTab) {
                                    tipAnalyzerTab.click();
                                }
                            }, 1500);
                        } else {
                            // Get the file uploader for File Organizer
                            const fileOrganizerInput = document.getElementById('fileOrganizerInput');
                            if (fileOrganizerInput) {
                                // Dispatch a custom event with the scanned files
                                const event = new CustomEvent('scannedFiles', { detail: { files: fileList } });
                                fileOrganizerInput.dispatchEvent(event);
                            }
                            
                            // Show notification before switching tabs
                            showNotification('Scanned files added to File Organizer. Redirecting...', 'success');
                            
                            // Switch to File Organizer tab after a short delay
                            setTimeout(() => {
                                const fileOrganizerTab = document.querySelector('.nav-item[data-tab="file-organizer-tab"]');
                                if (fileOrganizerTab) {
                                    fileOrganizerTab.click();
                                }
                            }, 1500);
                        }
                        
                        // Show results
                        this.showResults(scannedFiles);
                        
                        // Update status
                        this.updateStatus(`${scannedFiles.length} scanned image(s) added to ${target === 'tip-analyzer' ? 'Tip Analyzer' : 'File Organizer'}!`);
                    } else {
                        throw new Error('No scanned images were retrieved');
                    }
                } else {
                    throw new Error('No images found in scan job');
                }
            } else if (data.status === 'pending' || data.status === 'processing') {
                // Continue polling after a delay
                setTimeout(() => {
                    this.pollJobStatus(jobId, target);
                }, 2000); // Poll every 2 seconds
            } else {
                // Job failed
                throw new Error(`Scan job failed with status: ${data.status}`);
            }
        } catch (error) {
            console.error('Error polling scan job status:', error);
            this.updateStatus(`Error: ${error.message}`);
            
            // Create a retry button
            const retryButton = createElement('button', {
                className: 'btn btn-primary',
                style: { marginTop: '10px' },
                onClick: () => {
                    // Show form again
                    this.scanForm.style.display = 'block';
                    
                    // Remove retry button
                    if (retryButton.parentNode) {
                        retryButton.parentNode.removeChild(retryButton);
                    }
                    
                    this.updateStatus('Select scan settings and click "Start Scan"');
                }
            }, 'Try Again');
            
            // Add retry button after status
            this.scanStatus.parentNode.insertBefore(retryButton, this.scanStatus.nextSibling);
        }
    }
    
    /**
     * Get a scanned image
     * @param {string} jobId - The ID of the scan job
     * @param {string} imageId - The ID of the image
     * @param {string} format - The format of the image
     * @returns {Promise<File>} - Promise resolving to a File object
     */
    async getScannedImage(jobId, imageId, format) {
        // In a real implementation, this would fetch the image from the server
        // For now, we'll create a dummy image file
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1100;
        const ctx = canvas.getContext('2d');
        
        // Fill background (white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Add text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scanned Document', canvas.width / 2, 50);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Job ID: ${jobId}`, canvas.width / 2, 100);
        ctx.fillText(`Image ID: ${imageId}`, canvas.width / 2, 130);
        ctx.fillText(`Format: ${format}`, canvas.width / 2, 160);
        ctx.fillText(`Scanned at: ${new Date().toLocaleString()}`, canvas.width / 2, 190);
        
        // Add some dummy receipt content
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('RECEIPT', 100, 250);
        ctx.fillText('----------------------------', 100, 270);
        ctx.fillText('Item 1                $10.00', 100, 300);
        ctx.fillText('Item 2                $15.00', 100, 330);
        ctx.fillText('Item 3                $20.00', 100, 360);
        ctx.fillText('----------------------------', 100, 390);
        ctx.fillText('Subtotal              $45.00', 100, 420);
        ctx.fillText('Tax                    $3.60', 100, 450);
        ctx.fillText('----------------------------', 100, 480);
        ctx.fillText('Total                 $48.60', 100, 510);
        ctx.fillText('----------------------------', 100, 540);
        ctx.fillText('Tip                    $9.72', 100, 570);
        ctx.fillText('----------------------------', 100, 600);
        ctx.fillText('Grand Total           $58.32', 100, 630);
        
        // Convert to blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                // Create file from blob
                const fileName = `scan_${jobId}_${imageId}.${format.toLowerCase()}`;
                const file = new File([blob], fileName, { type: `image/${format.toLowerCase()}` });
                resolve(file);
            }, `image/${format.toLowerCase()}`);
        });
    }
    
    /**
     * Show scan results
     * @param {Array<File>} files - The scanned files
     */
    showResults(files) {
        // Clear results
        this.scanResults.innerHTML = '';
        
        // Create results list
        const resultsList = createElement('div', { className: 'scan-results-list' });
        
        // Add each file to the results list
        files.forEach((file, index) => {
            // Create a result item
            const resultItem = createElement('div', { className: 'scan-result-item' });
            
            // Create a thumbnail container
            const thumbnailContainer = createElement('div', { className: 'scan-thumbnail-container' });
            
            // Create a thumbnail image
            const thumbnail = createElement('img', {
                className: 'scan-thumbnail',
                src: URL.createObjectURL(file),
                alt: `Scanned image ${index + 1}`,
                style: {
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginRight: '10px'
                }
            });
            
            // Create file info
            const fileInfo = createElement('div', { className: 'scan-file-info' });
            
            // Create file name
            const fileName = createElement('div', { className: 'scan-file-name' }, file.name);
            
            // Create file size
            const fileSize = createElement('div', { className: 'scan-file-size' }, `${(file.size / 1024).toFixed(2)} KB`);
            
            // Add elements to file info
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);
            
            // Add elements to thumbnail container
            thumbnailContainer.appendChild(thumbnail);
            thumbnailContainer.appendChild(fileInfo);
            
            // Add thumbnail container to result item
            resultItem.appendChild(thumbnailContainer);
            
            // Add result item to results list
            resultsList.appendChild(resultItem);
        });
        
        // Add results list to results container
        this.scanResults.appendChild(resultsList);
        
        // Show results container
        this.scanResultsContainer.style.display = 'block';
        
        // Add a "Scan Again" button
        const scanAgainButton = createElement('button', {
            className: 'btn btn-primary',
            style: { marginTop: '20px' },
            onClick: this.handleScanButtonClick
        }, 'Scan Again');
        
        // Add scan again button to results container
        this.scanResults.appendChild(scanAgainButton);
    }
}
