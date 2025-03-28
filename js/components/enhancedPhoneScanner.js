/**
 * EnhancedPhoneScanner Class
 * Handles uploading, enhancing, and processing receipt images using IntSig technology
 */
class EnhancedPhoneScanner {
    /**
     * Create a new enhanced scanner
     * @param {Object} options - Configuration options
     * @param {string} options.apiEndpoint - API endpoint for image enhancement
     * @param {Function} options.onProgress - Progress callback
     * @param {Function} options.onComplete - Completion callback
     * @param {Function} options.onError - Error callback
     */
    constructor(options = {}) {
        // Default configuration
        this.config = {
            apiEndpoint: options.apiEndpoint || '/api/enhance-image',
            enhancementMode: 'auto', // auto, document, photo
            maxSize: 1600, // Output resolution: 1200, 1600, 2000, 2400
            mockMode: true, // For testing without actual API
            mockDelay: 1500, // Delay for mock responses
            multiPhotoMode: options.multiPhotoMode || false // Enable multi-photo mode
        };
        
        // Event callbacks
        this.onProgress = options.onProgress || function() {};
        this.onComplete = options.onComplete || function() {};
        this.onError = options.onError || function() {};
        
        // Internal state
        this.files = [];
        this.results = [];
        this.isProcessing = false;
        this.abortController = null;
        this.multiPhotoCapture = null; // Reference to multi-photo capture instance
        
        // Element references
        this.elements = {
            dropArea: null,
            fileInput: null,
            cameraInput: null,
            previewContainer: null,
            previewGrid: null,
            imageCount: null,
            processBtn: null,
            modeSelect: null,
            maxSizeSelect: null,
            progressBar: null,
            progressText: null,
            resultsSection: null,
            tableBody: null,
            jsonOutput: null,
            comparisonContainer: null
        };
    }
    
    /**
     * Initialize the component
     * @returns {EnhancedPhoneScanner} The instance for chaining
     */
    init() {
        this.cacheDOMElements();
        this.attachEventListeners();
        
        // Initialize multi-photo capture if needed
        if (this.config.multiPhotoMode) {
            this.initMultiPhotoCapture();
        }
        
        console.log('Enhanced Phone Scanner initialized successfully');
        return this;
    }
    
    /**
     * Initialize the multi-photo capture functionality
     */
    initMultiPhotoCapture() {
        // Check if the MultiPhotoCapture class is available
        if (typeof MultiPhotoCapture === 'undefined') {
            console.error('MultiPhotoCapture class not loaded. Include multi-photo-capture.js script.');
            return;
        }
        
        // Create a multi-photo capture instance
        this.multiPhotoCapture = new MultiPhotoCapture({
            onComplete: (files) => {
                console.log(`Multi-photo capture complete: ${files.length} images captured`);
                this.handleFiles(files);
                
                // Automatically process after a short delay to allow preview to update
                setTimeout(() => {
                    if (this.files.length > 0 && !this.isProcessing) {
                        console.log('Auto-processing multi-captured images');
                        this.processImages();
                    }
                }, 500);
            },
            onCancel: () => {
                console.log('Multi-photo capture cancelled');
            }
        });
    }
    
    /**
     * Cache DOM element references
     */
    cacheDOMElements() {
        this.elements.dropArea = document.getElementById('enhancedScannerDropArea');
        this.elements.fileInput = document.getElementById('enhancedFileInput');
        this.elements.cameraInput = document.getElementById('enhancedCameraInput');
        this.elements.previewContainer = document.getElementById('enhancedPreviewContainer');
        this.elements.previewGrid = document.getElementById('enhancedPreviewGrid');
        this.elements.imageCount = document.getElementById('enhancedImageCount');
        this.elements.processBtn = document.getElementById('enhancedProcessBtn');
        this.elements.modeSelect = document.getElementById('enhancedMode');
        this.elements.maxSizeSelect = document.getElementById('enhancedMaxSize');
        this.elements.progressBar = document.getElementById('enhancedProgressBar');
        this.elements.progressText = document.getElementById('enhancedProgressText');
        this.elements.resultsSection = document.getElementById('enhancedResultsSection');
        this.elements.tableBody = document.getElementById('enhancedTableBody');
        this.elements.jsonOutput = document.getElementById('enhancedJsonOutput');
        this.elements.comparisonContainer = document.getElementById('enhancedComparisonContainer');
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Drag and drop events
        if (this.elements.dropArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                this.elements.dropArea.addEventListener(eventName, e => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            this.elements.dropArea.addEventListener('dragenter', () => {
                this.elements.dropArea.classList.add('highlight');
            });
            
            this.elements.dropArea.addEventListener('dragleave', () => {
                this.elements.dropArea.classList.remove('highlight');
            });
            
            this.elements.dropArea.addEventListener('drop', e => {
                this.elements.dropArea.classList.remove('highlight');
                const files = e.dataTransfer.files;
                this.handleFiles(files);
            });
            
            // Click to browse
            this.elements.dropArea.addEventListener('click', () => {
                this.elements.fileInput.click();
            });
        }
        
        // File input change
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', () => {
                this.handleFiles(this.elements.fileInput.files);
            });
        }
        
        // Camera input change
        if (this.elements.cameraInput) {
            this.elements.cameraInput.addEventListener('change', () => {
                this.handleFiles(this.elements.cameraInput.files);
            });
        }
        
        // Take Camera Photo button
        const takeCameraPhotoBtn = document.getElementById('takeCameraPhotoBtn');
        if (takeCameraPhotoBtn) {
            takeCameraPhotoBtn.addEventListener('click', (e) => {
                // Use multi-photo capture if available and enabled
                if (this.multiPhotoCapture && this.config.multiPhotoMode) {
                    e.preventDefault(); // Prevent default action
                    this.openMultiPhotoCapture();
                } else {
                    // Fall back to default camera input
                    this.elements.cameraInput.click();
                }
            });
        }
        
        // Process button click
        if (this.elements.processBtn) {
            this.elements.processBtn.addEventListener('click', () => {
                this.processImages();
            });
        }
        
        // Enhancement mode change
        if (this.elements.modeSelect) {
            this.elements.modeSelect.addEventListener('change', () => {
                this.config.enhancementMode = this.elements.modeSelect.value;
            });
        }
        
        // Max size change
        if (this.elements.maxSizeSelect) {
            this.elements.maxSizeSelect.addEventListener('change', () => {
                this.config.maxSize = parseInt(this.elements.maxSizeSelect.value);
            });
        }
    }
    
    /**
     * Open the multi-photo capture interface
     */
    openMultiPhotoCapture() {
        if (!this.multiPhotoCapture) {
            console.warn('Multi-photo capture not initialized');
            // Fallback to regular camera input
            if (this.elements.cameraInput) {
                this.elements.cameraInput.click();
            }
            return;
        }
        
        // Open the camera in multi-photo mode
        this.multiPhotoCapture.openCamera();
    }
    
    /**
     * Handle files selected by the user
     * @param {FileList} fileList - List of files to handle
     */
    handleFiles(fileList) {
        // Convert FileList to array and filter for images
        const newFiles = Array.from(fileList).filter(file => {
            return file.type.match('image.*');
        });
        
        if (newFiles.length === 0) {
            console.warn('No valid image files selected');
            return;
        }
        
        // Add files to our array
        this.files = [...this.files, ...newFiles];
        
        // Update UI
        this.updatePreview();
        this.updateFileCount();
        this.updateProcessButton();
    }
    
    /**
     * Update preview grid with thumbnails
     */
    updatePreview() {
        if (!this.elements.previewGrid) return;
        
        // Clear existing previews
        this.elements.previewGrid.innerHTML = '';
        
        // Add new previews
        this.files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = e => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                const img = document.createElement('img');
                img.className = 'preview-img';
                img.src = e.target.result;
                img.alt = file.name;
                
                const details = document.createElement('div');
                details.className = 'preview-details';
                details.textContent = `${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''} (${this.formatFileSize(file.size)})`;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'preview-remove';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', () => {
                    this.removeFile(index);
                });
                
                previewItem.appendChild(img);
                previewItem.appendChild(details);
                previewItem.appendChild(removeBtn);
                
                this.elements.previewGrid.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
        
        // Show preview container if we have files
        if (this.files.length > 0) {
            this.elements.previewContainer.style.display = 'block';
        } else {
            this.elements.previewContainer.style.display = 'none';
        }
    }
    
    /**
     * Remove a file from the list
     * @param {number} index - Index of file to remove
     */
    removeFile(index) {
        this.files.splice(index, 1);
        this.updatePreview();
        this.updateFileCount();
        this.updateProcessButton();
    }
    
    /**
     * Update file count display
     */
    updateFileCount() {
        if (this.elements.imageCount) {
            this.elements.imageCount.textContent = `${this.files.length} image${this.files.length !== 1 ? 's' : ''} selected`;
        }
    }
    
    /**
     * Update process button state
     */
    updateProcessButton() {
        if (this.elements.processBtn) {
            const disabled = this.files.length === 0 || this.isProcessing;
            this.elements.processBtn.disabled = disabled;
            this.elements.processBtn.textContent = `Process ${this.files.length} Image${this.files.length !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Format file size in human-readable format
     * @param {number} size - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(size) {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    
    /**
     * Process images with enhancement
     */
    async processImages() {
        if (this.files.length === 0) {
            console.warn('No files to process');
            return;
        }
        
        if (this.isProcessing) {
            console.warn('Already processing files');
            return;
        }
        
        this.isProcessing = true;
        this.results = [];
        this.abortController = new AbortController();
        
        // Update UI to show processing state
        this.updateProcessButton();
        
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }
        
        // Process each image
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const progress = (i / this.files.length) * 100;
            
            // Update progress
            this.updateProgress(progress, `Processing image ${i + 1} of ${this.files.length}`);
            
            // Process the image
            try {
                const result = await this.enhanceImage(file);
                this.results.push(result);
            } catch (error) {
                console.error('Error processing image:', error);
                this.onError(error);
            }
        }
        
        // Complete processing
        this.updateProgress(100, 'Processing complete!');
        
        // Display results
        this.displayResults();
        
        // Reset state
        this.isProcessing = false;
        this.updateProcessButton();
        
        // Trigger complete callback
        this.onComplete(this.results);
    }
    
    /**
     * Update progress display
     * @param {number} percent - Progress percentage
     * @param {string} message - Progress message
     */
    updateProgress(percent, message) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = message;
        }
        
        // Call progress callback
        this.onProgress({
            percent,
            message
        });
    }
    
    /**
     * Enhance an image using IntSig API
     * @param {File} file - Image file to enhance
     * @returns {Promise<Object>} Enhanced image result
     */
    async enhanceImage(file) {
        if (this.config.mockMode) {
            // Mock enhancement for testing
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        originalFile: file,
                        originalUrl: URL.createObjectURL(file),
                        enhancedUrl: URL.createObjectURL(file), // In mock mode, just use the original
                        receipt: this.generateMockReceiptData(file),
                        enhancementMode: this.config.enhancementMode,
                        size: file.size,
                        enhancedSize: file.size,
                        filename: file.name,
                        timestamp: new Date().toISOString()
                    });
                }, this.config.mockDelay);
            });
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('mode', this.config.enhancementMode);
        formData.append('maxSize', this.config.maxSize);
        
        // Send to API
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            body: formData,
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            originalFile: file,
            originalUrl: URL.createObjectURL(file),
            enhancedUrl: data.enhancedUrl,
            receipt: data.receipt,
            enhancementMode: data.enhancementMode,
            size: file.size,
            enhancedSize: data.enhancedSize,
            filename: file.name,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Generate mock receipt data for testing
     * @param {File} file - Original image file
     * @returns {Object} Mock receipt data
     */
    generateMockReceiptData(file) {
        const names = ['John Smith', 'Alice Johnson', 'Robert Brown', 'Emily Davis', 'Michael Wilson'];
        const paymentTypes = ['Visa', 'MasterCard', 'American Express', 'Cash', 'Apple Pay'];
        
        const amount = parseFloat((Math.random() * 100 + 10).toFixed(2));
        const tipPercentage = [0.15, 0.18, 0.2, 0.22, 0.25][Math.floor(Math.random() * 5)];
        const tip = parseFloat((amount * tipPercentage).toFixed(2));
        const total = parseFloat((amount + tip).toFixed(2));
        
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];
        
        return {
            customer_name: names[Math.floor(Math.random() * names.length)],
            date: date,
            time: time,
            check_number: Math.floor(Math.random() * 10000).toString(),
            amount: `$${amount.toFixed(2)}`,
            tip: `$${tip.toFixed(2)}`,
            total: `$${total.toFixed(2)}`,
            payment_type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            signed: Math.random() > 0.3,
            filename: file.name,
            enhancement_quality: this.config.enhancementMode
        };
    }
    
    /**
     * Display results in the UI
     */
    displayResults() {
        this.displayTableView();
        this.displayJsonView();
        this.displayComparisonView();
    }
    
    /**
     * Display results in table view
     */
    displayTableView() {
        if (!this.elements.tableBody) return;
        
        // Clear existing table
        this.elements.tableBody.innerHTML = '';
        
        // Add rows for each result
        this.results.forEach((result, index) => {
            const receipt = result.receipt;
            
            const row = document.createElement('tr');
            
            // Thumbnail cell
            const thumbnailCell = document.createElement('td');
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = result.enhancedUrl;
            thumbnailImg.alt = `Receipt ${index + 1}`;
            thumbnailImg.style.width = '50px';
            thumbnailImg.style.height = '50px';
            thumbnailImg.style.objectFit = 'cover';
            thumbnailImg.style.cursor = 'pointer';
            thumbnailImg.addEventListener('click', () => {
                // Open image in new tab
                window.open(result.enhancedUrl, '_blank');
            });
            thumbnailCell.appendChild(thumbnailImg);
            row.appendChild(thumbnailCell);
            
            // Data cells
            const cellData = [
                receipt.customer_name,
                receipt.date,
                receipt.time,
                receipt.check_number,
                receipt.amount,
                receipt.tip,
                receipt.total,
                receipt.payment_type,
                receipt.signed ? 'Yes' : 'No'
            ];
            
            cellData.forEach(data => {
                const cell = document.createElement('td');
                cell.textContent = data;
                row.appendChild(cell);
            });
            
            this.elements.tableBody.appendChild(row);
        });
    }
    
    /**
     * Display results in JSON view
     */
    displayJsonView() {
        if (!this.elements.jsonOutput) return;
        
        // Format data for JSON display
        const jsonData = this.results.map(result => {
            return {
                ...result.receipt,
                enhancement_mode: result.enhancementMode,
                original_size: this.formatFileSize(result.size),
                enhanced_size: this.formatFileSize(result.enhancedSize),
                timestamp: result.timestamp
            };
        });
        
        // Display formatted JSON
        this.elements.jsonOutput.textContent = JSON.stringify(jsonData, null, 2);
    }
    
    /**
     * Display results in comparison view
     */
    displayComparisonView() {
        if (!this.elements.comparisonContainer) return;
        
        // Clear existing comparisons
        this.elements.comparisonContainer.innerHTML = '';
        
        // Add comparison sliders for each result
        this.results.forEach((result, index) => {
            const comparisonItem = document.createElement('div');
            comparisonItem.className = 'comparison-item';
            
            const title = document.createElement('h3');
            title.className = 'comparison-title';
            title.textContent = `Receipt ${index + 1}: ${result.filename}`;
            
            const info = document.createElement('div');
            info.className = 'comparison-info';
            
            const modeItem = document.createElement('div');
            modeItem.className = 'info-item';
            modeItem.innerHTML = `<span class="info-label">Mode:</span> ${result.enhancementMode}`;
            
            const sizeItem = document.createElement('div');
            sizeItem.className = 'info-item';
            sizeItem.innerHTML = `<span class="info-label">Original:</span> ${this.formatFileSize(result.size)}`;
            
            const enhancedSizeItem = document.createElement('div');
            enhancedSizeItem.className = 'info-item';
            enhancedSizeItem.innerHTML = `<span class="info-label">Enhanced:</span> ${this.formatFileSize(result.enhancedSize || result.size)}`;
            
            info.appendChild(modeItem);
            info.appendChild(sizeItem);
            info.appendChild(enhancedSizeItem);
            
            const slider = document.createElement('div');
            slider.className = 'comparison-slider';
            
            const beforeDiv = document.createElement('div');
            beforeDiv.className = 'comparison-before';
            
            const afterDiv = document.createElement('div');
            afterDiv.className = 'comparison-after';
            
            const beforeImg = document.createElement('img');
            beforeImg.className = 'before-image';
            beforeImg.src = result.originalUrl;
            beforeImg.alt = 'Original image';
            
            const afterImg = document.createElement('img');
            afterImg.className = 'after-image';
            afterImg.src = result.enhancedUrl;
            afterImg.alt = 'Enhanced image';
            
            const sliderHandle = document.createElement('div');
            sliderHandle.className = 'slider-handle';
            
            const beforeLabel = document.createElement('div');
            beforeLabel.className = 'comparison-label label-before';
            beforeLabel.textContent = 'Original';
            
            const afterLabel = document.createElement('div');
            afterLabel.className = 'comparison-label label-after';
            afterLabel.textContent = 'Enhanced';
            
            // Append all elements
            beforeDiv.appendChild(beforeImg);
            afterDiv.appendChild(afterImg);
            
            slider.appendChild(afterDiv);  // After goes first (behind)
            slider.appendChild(beforeDiv); // Before goes second (in front)
            slider.appendChild(sliderHandle);
            slider.appendChild(beforeLabel);
            slider.appendChild(afterLabel);
            
            comparisonItem.appendChild(title);
            comparisonItem.appendChild(info);
            comparisonItem.appendChild(slider);
            
            this.elements.comparisonContainer.appendChild(comparisonItem);
            
            // Add drag functionality
            this.initializeSlider(slider);
        });
    }
    
    /**
     * Initialize slider functionality
     * @param {HTMLElement} slider - Slider element
     */
    initializeSlider(slider) {
        let isDragging = false;
        const beforeDiv = slider.querySelector('.comparison-before');
        const sliderHandle = slider.querySelector('.slider-handle');
        
        // Track pointer events
        const handleMove = (e) => {
            if (!isDragging) return;
            
            // Get the x coordinate within the slider
            let x;
            if (e.type.includes('touch')) {
                x = e.touches[0].clientX - slider.getBoundingClientRect().left;
            } else {
                x = e.clientX - slider.getBoundingClientRect().left;
            }
            
            // Calculate percentage and constrain to 0-100%
            let percent = (x / slider.offsetWidth) * 100;
            percent = Math.max(0, Math.min(100, percent));
            
            // Update UI
            beforeDiv.style.width = `${percent}%`;
            sliderHandle.style.left = `${percent}%`;
        };
        
        const handleDown = () => {
            isDragging = true;
        };
        
        const handleUp = () => {
            isDragging = false;
        };
        
        // Add event listeners
        sliderHandle.addEventListener('mousedown', handleDown);
        sliderHandle.addEventListener('touchstart', handleDown);
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedPhoneScanner;
}
