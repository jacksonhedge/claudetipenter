/**
 * Epson Scanner Component
 * Integrates Epson Connect API scanning functionality into the application
 */
import { addFiles } from '../services/fileService.js';
import { createElement, showNotification } from '../utils/uiUtils.js';

export default class EpsonScanner {
    /**
     * Initialize the Epson Scanner component
     * @param {Object} options - Configuration options
     * @param {string} options.scanBtnId - ID of the scan button element
     * @param {Function} options.onFilesAdded - Callback when files are added to the uploader
     */
    constructor(options) {
        this.options = options;
        this.scanBtn = document.getElementById(options.scanBtnId);
        this.onFilesAdded = options.onFilesAdded;
        
        // Initialize modal elements
        this.modal = null;
        this.scanDestinations = [];
        
        // Bind methods
        this.handleScanClick = this.handleScanClick.bind(this);
        this.createScanModal = this.createScanModal.bind(this);
        this.closeScanModal = this.closeScanModal.bind(this);
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
        if (this.scanBtn) {
            this.scanBtn.addEventListener('click', this.handleScanClick);
        } else {
            console.error('Scan button not found');
        }
    }
    
    /**
     * Handle scan button click
     * @param {Event} e - The click event
     */
    async handleScanClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // Create and show the scan modal
            this.createScanModal();
            
            // Get scan destinations
            await this.getScanDestinations();
        } catch (error) {
            console.error('Error initializing scan:', error);
            showNotification('Error initializing scan: ' + error.message, 'error');
            this.closeScanModal();
        }
    }
    
    /**
     * Create the scan modal dialog
     */
    createScanModal() {
        // Create modal container
        this.modal = createElement('div', { className: 'scan-modal' });
        
        // Create modal content
        const modalContent = createElement('div', { className: 'scan-modal-content' });
        
        // Create header with close button
        const modalHeader = createElement('div', { className: 'scan-modal-header' });
        
        const modalTitle = createElement('h2', {}, 'Scan with Epson Connect');
        
        const closeButton = createElement('button', {
            className: 'scan-modal-close',
            innerHTML: '&times;',
            onClick: this.closeScanModal
        });
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // Create modal body
        const modalBody = createElement('div', { className: 'scan-modal-body' });
        
        // Create loading indicator
        this.loadingIndicator = createElement('div', { 
            className: 'scan-loading-indicator',
            style: { display: 'block' }
        }, 'Loading scan destinations...');
        
        // Create form container (initially hidden)
        this.formContainer = createElement('div', { 
            className: 'scan-form-container',
            style: { display: 'none' }
        });
        
        // Create form
        const form = createElement('form', { 
            id: 'scan-form',
            onSubmit: (e) => {
                e.preventDefault();
                this.startScanJob();
            }
        });
        
        // Create destination select
        const destinationGroup = createElement('div', { className: 'form-group' });
        const destinationLabel = createElement('label', { htmlFor: 'scan-destinations' }, 'Destination:');
        this.destinationSelect = createElement('select', { 
            id: 'scan-destinations',
            className: 'form-control',
            required: true
        });
        
        destinationGroup.appendChild(destinationLabel);
        destinationGroup.appendChild(this.destinationSelect);
        
        // Create resolution select
        const resolutionGroup = createElement('div', { className: 'form-group' });
        const resolutionLabel = createElement('label', { htmlFor: 'scan-resolution' }, 'Resolution:');
        const resolutionSelect = createElement('select', { 
            id: 'scan-resolution',
            className: 'form-control'
        }, [
            createElement('option', { value: '100' }, '100 DPI'),
            createElement('option', { value: '200' }, '200 DPI'),
            createElement('option', { value: '300', selected: true }, '300 DPI'),
            createElement('option', { value: '600' }, '600 DPI')
        ]);
        
        resolutionGroup.appendChild(resolutionLabel);
        resolutionGroup.appendChild(resolutionSelect);
        
        // Create color mode select
        const colorModeGroup = createElement('div', { className: 'form-group' });
        const colorModeLabel = createElement('label', { htmlFor: 'scan-color-mode' }, 'Color Mode:');
        const colorModeSelect = createElement('select', { 
            id: 'scan-color-mode',
            className: 'form-control'
        }, [
            createElement('option', { value: 'color', selected: true }, 'Color'),
            createElement('option', { value: 'grayscale' }, 'Grayscale'),
            createElement('option', { value: 'monochrome' }, 'Monochrome')
        ]);
        
        colorModeGroup.appendChild(colorModeLabel);
        colorModeGroup.appendChild(colorModeSelect);
        
        // Create file format select
        const fileFormatGroup = createElement('div', { className: 'form-group' });
        const fileFormatLabel = createElement('label', { htmlFor: 'scan-file-format' }, 'File Format:');
        const fileFormatSelect = createElement('select', { 
            id: 'scan-file-format',
            className: 'form-control'
        }, [
            createElement('option', { value: 'pdf', selected: true }, 'PDF'),
            createElement('option', { value: 'jpeg' }, 'JPEG'),
            createElement('option', { value: 'png' }, 'PNG')
        ]);
        
        fileFormatGroup.appendChild(fileFormatLabel);
        fileFormatGroup.appendChild(fileFormatSelect);
        
        // Create submit button
        const submitButton = createElement('button', { 
            type: 'submit',
            className: 'btn btn-success'
        }, 'Start Scan');
        
        // Assemble form
        form.appendChild(destinationGroup);
        form.appendChild(resolutionGroup);
        form.appendChild(colorModeGroup);
        form.appendChild(fileFormatGroup);
        form.appendChild(submitButton);
        
        this.formContainer.appendChild(form);
        
        // Create status container
        this.statusContainer = createElement('div', { 
            className: 'scan-status-container',
            style: { display: 'none' }
        });
        
        this.statusText = createElement('p', { id: 'scan-status' }, '');
        this.statusContainer.appendChild(this.statusText);
        
        // Add elements to modal body
        modalBody.appendChild(this.loadingIndicator);
        modalBody.appendChild(this.formContainer);
        modalBody.appendChild(this.statusContainer);
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        this.modal.appendChild(modalContent);
        
        // Add modal to body
        document.body.appendChild(this.modal);
        
        // Add event listener to close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeScanModal();
            }
        });
        
        // Add event listener to close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal) {
                this.closeScanModal();
            }
        });
        
        // Add styles if they don't exist
        this.addModalStyles();
    }
    
    /**
     * Add modal styles to the document
     */
    addModalStyles() {
        // Check if styles already exist
        if (document.getElementById('epson-scanner-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'epson-scanner-styles';
        
        // Add CSS
        style.textContent = `
            .scan-modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }
            
            .scan-modal-content {
                background-color: #fff;
                margin: 10% auto;
                padding: 20px;
                border-radius: 5px;
                width: 80%;
                max-width: 500px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .scan-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .scan-modal-header h2 {
                margin: 0;
                font-size: 1.5rem;
            }
            
            .scan-modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #888;
            }
            
            .scan-modal-close:hover {
                color: #000;
            }
            
            .scan-modal-body {
                margin-bottom: 20px;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .form-control {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            
            .scan-loading-indicator {
                text-align: center;
                padding: 20px;
            }
            
            .scan-status-container {
                text-align: center;
                padding: 20px;
            }
            
            .btn {
                display: inline-block;
                padding: 8px 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .btn-success {
                background-color: #28a745;
            }
            
            .btn:hover {
                opacity: 0.9;
            }
        `;
        
        // Add style to document head
        document.head.appendChild(style);
    }
    
    /**
     * Close the scan modal
     */
    closeScanModal() {
        if (this.modal) {
            document.body.removeChild(this.modal);
            this.modal = null;
        }
    }
    
    /**
     * Get scan destinations from the server
     */
    async getScanDestinations() {
        try {
            // Show loading indicator
            this.loadingIndicator.style.display = 'block';
            this.formContainer.style.display = 'none';
            this.statusContainer.style.display = 'none';
            
            // Get scan destinations from server
            const response = await fetch('/api/epson/scan/destinations');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get scan destinations');
            }
            
            // Store scan destinations
            this.scanDestinations = data.destinations || [];
            
            // Clear destination select
            this.destinationSelect.innerHTML = '';
            
            // Add destinations to select
            if (this.scanDestinations.length === 0) {
                // No destinations found
                throw new Error('No scan destinations found');
            }
            
            // Add destinations to select
            this.scanDestinations.forEach(dest => {
                const option = createElement('option', { value: dest.id }, dest.name);
                this.destinationSelect.appendChild(option);
            });
            
            // Hide loading indicator and show form
            this.loadingIndicator.style.display = 'none';
            this.formContainer.style.display = 'block';
        } catch (error) {
            console.error('Error getting scan destinations:', error);
            showNotification('Error getting scan destinations: ' + error.message, 'error');
            this.closeScanModal();
        }
    }
    
    /**
     * Start a scan job
     */
    async startScanJob() {
        try {
            // Get form values
            const destinationId = document.getElementById('scan-destinations').value;
            const resolution = document.getElementById('scan-resolution').value;
            const colorMode = document.getElementById('scan-color-mode').value;
            const fileFormat = document.getElementById('scan-file-format').value;
            
            // Hide form and show status
            this.formContainer.style.display = 'none';
            this.statusContainer.style.display = 'block';
            this.statusText.textContent = 'Starting scan job...';
            
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
            this.statusText.textContent = `Scan job started. Job ID: ${jobId}`;
            
            // Poll for job status
            this.pollJobStatus(jobId);
        } catch (error) {
            console.error('Error starting scan job:', error);
            this.statusText.textContent = `Error: ${error.message}`;
            
            // Show try again button
            const tryAgainBtn = createElement('button', {
                className: 'btn',
                onClick: () => {
                    // Hide status and show form
                    this.statusContainer.style.display = 'none';
                    this.formContainer.style.display = 'block';
                }
            }, 'Try Again');
            
            this.statusContainer.appendChild(tryAgainBtn);
        }
    }
    
    /**
     * Poll for scan job status
     * @param {string} jobId - The ID of the scan job
     */
    async pollJobStatus(jobId) {
        try {
            // Update status
            this.statusText.textContent = `Checking scan job status (${jobId})...`;
            
            // Get job status
            const response = await fetch(`/api/epson/scan/jobs/${jobId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get scan job status');
            }
            
            // Update status
            this.statusText.textContent = `Scan job status: ${data.status}`;
            
            // If job is completed, get the scanned image
            if (data.status === 'completed') {
                // Update status
                this.statusText.textContent = 'Scan job completed successfully!';
                
                // Get scanned images
                if (data.images && data.images.length > 0) {
                    // Update status
                    this.statusText.textContent = 'Retrieving scanned images...';
                    
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
                    
                    // Add files to uploader
                    if (scannedFiles.length > 0) {
                        // Update status
                        this.statusText.textContent = `Adding ${scannedFiles.length} scanned image(s) to uploader...`;
                        
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
                        
                        // Add files to uploader
                        await addFiles(fileList, this.onFilesAdded);
                        
                        // Update status
                        this.statusText.textContent = `${scannedFiles.length} scanned image(s) added to uploader!`;
                        
                        // Close modal after a delay
                        setTimeout(() => {
                            this.closeScanModal();
                        }, 2000);
                    } else {
                        throw new Error('No scanned images were retrieved');
                    }
                } else {
                    throw new Error('No images found in scan job');
                }
            } else if (data.status === 'pending' || data.status === 'processing') {
                // Continue polling after a delay
                setTimeout(() => {
                    this.pollJobStatus(jobId);
                }, 2000); // Poll every 2 seconds
            } else {
                // Job failed
                throw new Error(`Scan job failed with status: ${data.status}`);
            }
        } catch (error) {
            console.error('Error polling scan job status:', error);
            this.statusText.textContent = `Error: ${error.message}`;
            
            // Show try again button
            const tryAgainBtn = createElement('button', {
                className: 'btn',
                onClick: () => {
                    // Hide status and show form
                    this.statusContainer.style.display = 'none';
                    this.formContainer.style.display = 'block';
                }
            }, 'Try Again');
            
            this.statusContainer.appendChild(tryAgainBtn);
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
}
