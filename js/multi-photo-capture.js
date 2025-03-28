/**
 * Multi-Photo Capture Module
 * Handles capturing multiple photos without closing the camera
 */
class MultiPhotoCapture {
    /**
     * Create a new multi-photo capture instance
     * @param {Object} options - Configuration options
     * @param {Function} options.onComplete - Callback function when photo capture is complete
     * @param {Function} options.onCancel - Callback function when photo capture is cancelled
     */
    constructor(options = {}) {
        // Callbacks
        this.onComplete = options.onComplete || function() {};
        this.onCancel = options.onCancel || function() {};
        
        // State
        this.capturedImages = [];
        this.stream = null;
        this.isCameraOpen = false;
        
        // Elements
        this.multiPhotoContainer = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.galleryElement = null;
        this.captureBtn = null;
        this.closeCameraBtn = null;
        this.doneBtn = null;
        this.clearBtn = null;
        this.counterElement = null;
        
        // Create UI elements
        this.createElements();
    }
    
    /**
     * Create UI elements for multi-photo capture
     */
    createElements() {
        // Create container
        this.multiPhotoContainer = document.createElement('div');
        this.multiPhotoContainer.className = 'multi-photo-mode';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'multi-photo-header';
        
        const title = document.createElement('h3');
        title.className = 'multi-photo-title';
        title.textContent = 'Multi-Photo Capture';
        
        this.closeCameraBtn = document.createElement('button');
        this.closeCameraBtn.className = 'close-camera-btn';
        this.closeCameraBtn.innerHTML = '&times;';
        
        header.appendChild(title);
        header.appendChild(this.closeCameraBtn);
        
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'camera-container';
        
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'videoElement';
        this.videoElement.autoplay = true;
        this.videoElement.playsinline = true;
        
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = 'canvasElement';
        this.canvasElement.style.display = 'none';
        
        this.counterElement = document.createElement('div');
        this.counterElement.id = 'counter';
        this.counterElement.textContent = 'Photos: 0';
        
        const cameraControls = document.createElement('div');
        cameraControls.className = 'camera-controls';
        
        this.captureBtn = document.createElement('button');
        this.captureBtn.className = 'capture-btn';
        
        cameraControls.appendChild(this.captureBtn);
        
        videoContainer.appendChild(this.videoElement);
        videoContainer.appendChild(this.canvasElement);
        videoContainer.appendChild(this.counterElement);
        videoContainer.appendChild(cameraControls);
        
        // Create gallery
        this.galleryElement = document.createElement('div');
        this.galleryElement.className = 'gallery';
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'multi-photo-footer';
        
        const actions = document.createElement('div');
        actions.className = 'multi-photo-actions';
        
        this.doneBtn = document.createElement('button');
        this.doneBtn.className = 'btn-done';
        this.doneBtn.textContent = 'Use Photos';
        this.doneBtn.disabled = true;
        
        this.clearBtn = document.createElement('button');
        this.clearBtn.className = 'btn-danger';
        this.clearBtn.textContent = 'Clear All';
        this.clearBtn.disabled = true;
        
        actions.appendChild(this.clearBtn);
        actions.appendChild(this.doneBtn);
        
        footer.appendChild(actions);
        
        // Create fullscreen preview
        this.fullscreenPreview = document.createElement('div');
        this.fullscreenPreview.className = 'fullscreen-preview';
        
        const closePreview = document.createElement('span');
        closePreview.className = 'close-preview';
        closePreview.innerHTML = '&times;';
        closePreview.addEventListener('click', () => {
            this.fullscreenPreview.style.display = 'none';
        });
        
        const previewImage = document.createElement('img');
        previewImage.id = 'previewImage';
        previewImage.alt = 'Preview';
        
        this.fullscreenPreview.appendChild(closePreview);
        this.fullscreenPreview.appendChild(previewImage);
        
        // Append all elements to container
        this.multiPhotoContainer.appendChild(header);
        this.multiPhotoContainer.appendChild(videoContainer);
        this.multiPhotoContainer.appendChild(this.galleryElement);
        this.multiPhotoContainer.appendChild(footer);
        this.multiPhotoContainer.appendChild(this.fullscreenPreview);
        
        // Append container to body
        document.body.appendChild(this.multiPhotoContainer);
        
        // Add event listeners
        this.attachEventListeners();
    }
    
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Close camera button
        this.closeCameraBtn.addEventListener('click', () => {
            this.closeCamera();
        });
        
        // Capture button
        this.captureBtn.addEventListener('click', () => {
            this.capturePhoto();
        });
        
        // Done button
        this.doneBtn.addEventListener('click', () => {
            this.completeCapture();
        });
        
        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearGallery();
        });
    }
    
    /**
     * Open the camera and start the video stream
     * @returns {Promise<void>}
     */
    async openCamera() {
        if (this.isCameraOpen) return;
        
        try {
            // Request camera access
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            
            // Size the canvas to match video dimensions once we have them
            this.videoElement.onloadedmetadata = () => {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
            };
            
            // Show the multi-photo container
            this.multiPhotoContainer.style.display = 'flex';
            this.isCameraOpen = true;
            
            // Update UI
            this.updateCounter();
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            // If camera access fails, we could show an error message or fallback
            this.showErrorMessage('Could not access camera: ' + error.message);
        }
    }
    
    /**
     * Close the camera and stop the video stream
     */
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
        
        this.videoElement.style.display = 'none';
        this.multiPhotoContainer.style.display = 'none';
        this.isCameraOpen = false;
        
        // Trigger cancel callback if no images were captured
        if (this.capturedImages.length === 0) {
            this.onCancel();
        }
    }
    
    /**
     * Capture a photo from the video stream
     */
    capturePhoto() {
        if (!this.isCameraOpen) return;
        
        const context = this.canvasElement.getContext('2d');
        
        // Draw the current video frame to the canvas
        context.drawImage(
            this.videoElement, 
            0, 0, 
            this.canvasElement.width, 
            this.canvasElement.height
        );
        
        // Convert to blob
        this.canvasElement.toBlob(blob => {
            const imageUrl = URL.createObjectURL(blob);
            
            // Add to captured images array
            this.capturedImages.push({
                url: imageUrl,
                blob: blob,
                timestamp: new Date().toISOString()
            });
            
            // Add to gallery UI
            this.addImageToGallery(imageUrl, this.capturedImages.length - 1);
            
            // Update counter and buttons
            this.updateCounter();
            this.updateButtonStates();
            
            // Provide visual feedback
            this.captureBtn.style.backgroundColor = '#34c759';
            setTimeout(() => {
                this.captureBtn.style.backgroundColor = 'white';
            }, 300);
            
        }, 'image/jpeg', 0.8);
    }
    
    /**
     * Add an image to the gallery
     * @param {string} imageUrl - URL of the image
     * @param {number} index - Index in the capturedImages array
     */
    addImageToGallery(imageUrl, index) {
        // Create gallery item
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('data-index', index);
        
        // Create image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Captured image ' + (index + 1);
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.removeImage(index);
        });
        
        // Add click event to show preview
        galleryItem.addEventListener('click', () => {
            this.showImagePreview(imageUrl);
        });
        
        // Append elements
        galleryItem.appendChild(img);
        galleryItem.appendChild(removeBtn);
        this.galleryElement.appendChild(galleryItem);
    }
    
    /**
     * Remove an image from the gallery
     * @param {number} index - Index of the image to remove
     */
    removeImage(index) {
        // Remove from array
        this.capturedImages.splice(index, 1);
        
        // Rebuild gallery to update indices
        this.rebuildGallery();
        
        // Update counter and buttons
        this.updateCounter();
        this.updateButtonStates();
    }
    
    /**
     * Rebuild the gallery with current images
     */
    rebuildGallery() {
        // Clear gallery
        this.galleryElement.innerHTML = '';
        
        // Add all images
        this.capturedImages.forEach((image, index) => {
            this.addImageToGallery(image.url, index);
        });
    }
    
    /**
     * Update the photo counter
     */
    updateCounter() {
        this.counterElement.textContent = 'Photos: ' + this.capturedImages.length;
    }
    
    /**
     * Update button states based on the number of captured images
     */
    updateButtonStates() {
        const hasImages = this.capturedImages.length > 0;
        this.doneBtn.disabled = !hasImages;
        this.clearBtn.disabled = !hasImages;
    }
    
    /**
     * Clear all images from the gallery
     */
    clearGallery() {
        if (confirm('Are you sure you want to clear all photos?')) {
            this.capturedImages = [];
            this.galleryElement.innerHTML = '';
            this.updateCounter();
            this.updateButtonStates();
        }
    }
    
    /**
     * Show fullscreen preview of an image
     * @param {string} imageUrl - URL of the image to preview
     */
    showImagePreview(imageUrl) {
        const previewImage = document.getElementById('previewImage');
        previewImage.src = imageUrl;
        this.fullscreenPreview.style.display = 'flex';
    }
    
    /**
     * Complete the capture process and return the captured images
     */
    completeCapture() {
        if (this.capturedImages.length === 0) {
            return;
        }
        
        // Convert captured images to File objects
        const files = this.capturedImages.map((image, index) => {
            return new File(
                [image.blob], 
                `captured-image-${index + 1}.jpg`, 
                { type: 'image/jpeg' }
            );
        });
        
        // Close camera
        this.closeCamera();
        
        // Trigger complete callback with files
        this.onComplete(files);
        
        // Clear captured images
        this.capturedImages = [];
        this.galleryElement.innerHTML = '';
        this.updateCounter();
        this.updateButtonStates();
    }
    
    /**
     * Show an error message to the user
     * @param {string} message - Error message to display
     */
    showErrorMessage(message) {
        // Here you could create and show a UI element with the error message
        console.error('Multi-Photo Capture Error:', message);
        
        // Simple alert as fallback
        alert('Camera error: ' + message);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiPhotoCapture;
}
