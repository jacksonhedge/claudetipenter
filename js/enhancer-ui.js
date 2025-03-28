/**
 * Image Enhancer UI Script
 * Handles the UI for the image enhancer functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('enhancerDropArea');
    const fileInput = document.getElementById('enhancerFileInput');
    const cameraInput = document.getElementById('enhancerCameraInput');
    const previewContainer = document.getElementById('enhancerPreviewContainer');
    const previewGrid = document.getElementById('enhancerPreviewGrid');
    const imageCountEl = document.getElementById('enhancerImageCount');
    const settingsCard = document.getElementById('enhancerSettingsCard');
    const enhanceButton = document.getElementById('enhanceButton');
    const enhanceMode = document.getElementById('enhanceMode');
    const maxSize = document.getElementById('maxSize');
    const resultsContainer = document.getElementById('resultsContainer');
    const progressContainer = document.getElementById('enhancerProgressContainer');
    const progressBar = document.getElementById('enhancerProgressBar');
    const progressText = document.getElementById('enhancerProgressText');
    const comparisonContainer = document.getElementById('comparisonContainer');
    const comparisonTemplate = document.getElementById('comparisonTemplate');
    
    // State
    let uploadedFiles = [];
    let processingResults = [];
    
    // Initialize the image enhancer
    const imageEnhancer = new ImageEnhancer({
        onProgress: updateProgress,
        onComplete: showResults,
        onError: handleError
    }).init();
    
    // Event Listeners
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        
        handleFiles(e.dataTransfer.files);
    });
    
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
    
    cameraInput.addEventListener('change', () => {
        handleFiles(cameraInput.files);
    });
    
    enhanceButton.addEventListener('click', () => {
        startEnhancement();
    });
    
    /**
     * Handle the files selected by the user
     * @param {FileList} files - The selected files
     */
    function handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // Filter for image files
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }
        
        // Add files to state
        uploadedFiles = [...uploadedFiles, ...imageFiles];
        
        // Update UI
        updatePreview();
        settingsCard.style.display = 'block';
    }
    
    /**
     * Update the preview grid with thumbnails
     */
    function updatePreview() {
        if (uploadedFiles.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }
        
        previewContainer.style.display = 'block';
        previewGrid.innerHTML = '';
        
        // Update count display
        imageCountEl.textContent = `${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'image' : 'images'} selected`;
        
        // Create thumbnails
        uploadedFiles.forEach((file, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'preview-thumbnail';
            thumbnail.style.position = 'relative';
            
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'remove-thumbnail';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '2px';
            removeBtn.style.right = '2px';
            removeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.display = 'flex';
            removeBtn.style.justifyContent = 'center';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.fontSize = '16px';
            removeBtn.style.padding = '0';
            
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(index);
            });
            
            thumbnail.appendChild(img);
            thumbnail.appendChild(removeBtn);
            previewGrid.appendChild(thumbnail);
        });
        
        // Update enhance button text
        enhanceButton.textContent = `Enhance ${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'Image' : 'Images'}`;
    }
    
    /**
     * Remove a file from the list
     * @param {number} index - The index of the file to remove
     */
    function removeFile(index) {
        uploadedFiles.splice(index, 1);
        updatePreview();
        
        if (uploadedFiles.length === 0) {
            settingsCard.style.display = 'none';
        }
    }
    
    /**
     * Start the enhancement process
     */
    function startEnhancement() {
        if (uploadedFiles.length === 0) return;
        
        // Update UI
        enhanceButton.disabled = true;
        resultsContainer.style.display = 'block';
        progressContainer.style.display = 'flex';
        comparisonContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressText.textContent = 'Processing 0/' + uploadedFiles.length;
        
        // Configure enhancer
        imageEnhancer.setEnhanceMode(enhanceMode.value);
        imageEnhancer.setMaxSize(parseInt(maxSize.value));
        
        // Reset results
        processingResults = [];
        
        // Add files to queue
        uploadedFiles.forEach(file => {
            imageEnhancer.addToQueue(file);
        });
        
        // Start processing
        imageEnhancer.processQueue();
    }
    
    /**
     * Update the progress display
     * @param {Object} progress - The progress info
     */
    function updateProgress(progress) {
        const percent = Math.round((progress.processed / progress.queueLength) * 100);
        progressBar.style.width = percent + '%';
        progressText.textContent = `Processing ${progress.processed + 1}/${progress.queueLength}`;
    }
    
    /**
     * Handle processing errors
     * @param {Error} error - The error object
     * @param {Object} item - The queue item that failed
     */
    function handleError(error, item) {
        console.error('Enhancement error:', error);
        // We could show an error message here, but for now we'll just
        // let the onComplete handler display what results we have
    }
    
    /**
     * Show the enhancement results
     */
    function showResults() {
        enhanceButton.disabled = false;
        progressContainer.style.display = 'none';
        comparisonContainer.style.display = 'block';
        comparisonContainer.innerHTML = '';
        
        // Get completed results
        processingResults = imageEnhancer.processingQueue
            .filter(item => item.status === 'completed')
            .map(item => item.result);
        
        if (processingResults.length === 0) {
            comparisonContainer.innerHTML = '<p>No images were successfully enhanced.</p>';
            return;
        }
        
        // Create a comparison slider for each result
        processingResults.forEach((result, index) => {
            const item = createComparisonSlider(
                result.originalImage,
                result.enhancedImage,
                enhanceMode.value,
                result.borderPoints && result.borderPoints.length > 0
            );
            
            comparisonContainer.appendChild(item);
        });
        
        // Initialize the comparison sliders
        initSliders();
    }
    
    /**
     * Create a comparison slider for before/after images
     * @param {string} originalSrc - Source URL for the original image
     * @param {string} enhancedSrc - Source URL for the enhanced image
     * @param {string} mode - The enhancement mode used
     * @param {boolean} hasBorder - Whether borders were detected
     * @returns {HTMLElement} The comparison slider element
     */
    function createComparisonSlider(originalSrc, enhancedSrc, mode, hasBorder) {
        const clone = document.importNode(comparisonTemplate.content, true);
        
        // Set the image sources
        clone.querySelector('.before-image').src = originalSrc;
        clone.querySelector('.after-image').src = enhancedSrc;
        
        // Set the info values
        clone.querySelector('.mode-value').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
        clone.querySelector('.border-status').textContent = hasBorder ? 'Detected' : 'Not detected';
        
        return clone;
    }
    
    /**
     * Initialize the interactive comparison sliders
     */
    function initSliders() {
        document.querySelectorAll('.comparison-slider').forEach(slider => {
            const sliderHandle = slider.querySelector('.slider-handle');
            const comparisonAfter = slider.querySelector('.comparison-after');
            
            // Mouse events
            slider.addEventListener('mousemove', handleSliderMove);
            
            // Touch events
            slider.addEventListener('touchmove', handleSliderMove);
            
            function handleSliderMove(e) {
                const sliderRect = slider.getBoundingClientRect();
                let x;
                
                if (e.type === 'touchmove') {
                    x = e.touches[0].clientX - sliderRect.left;
                } else {
                    x = e.clientX - sliderRect.left;
                }
                
                // Calculate percentage
                const percent = Math.max(0, Math.min(100, (x / sliderRect.width) * 100));
                
                // Update position
                sliderHandle.style.left = percent + '%';
                comparisonAfter.style.width = percent + '%';
            }
        });
    }
});
