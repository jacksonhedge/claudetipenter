/**
 * Enhanced Phone Scanner Initialization
 * This script initializes the enhanced phone scanner component on the page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Enhanced Phone Scanner...');
    
    // Check if we're on the enhanced scanner page or test page
    const isEnhancedScannerPage = window.location.href.includes('enhanced-scanner.html') || 
                                  document.getElementById('enhanced-scanner-tab') !== null;
    
    if (!isEnhancedScannerPage) {
        console.log('Not on enhanced scanner page, skipping initialization');
        return;
    }
    
    // Initialize the scanner with configuration
    try {
        const scanner = new EnhancedPhoneScanner({
            apiEndpoint: '/api/enhance-image',
            multiPhotoMode: true, // Enable multi-photo mode
            onProgress: (progress) => {
                console.log(`Enhancement progress: ${progress.percent.toFixed(1)}% - ${progress.message}`);
            },
            onComplete: (results) => {
                console.log(`Enhancement complete: ${results.length} images processed`);
                // Show a success message or notification here
                const notification = document.createElement('div');
                notification.className = 'notification success';
                notification.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Successfully processed ${results.length} image${results.length !== 1 ? 's' : ''}!</span>
                    <button class="close-notification"><i class="fas fa-times"></i></button>
                `;
                document.body.appendChild(notification);
                
                // Auto-remove notification after 5 seconds
                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 500);
                }, 5000);
                
                // Add close button functionality
                const closeBtn = notification.querySelector('.close-notification');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        notification.remove();
                    });
                }
            },
            onError: (error) => {
                console.error('Enhancement error:', error);
                // Show an error message
                const notification = document.createElement('div');
                notification.className = 'notification error';
                notification.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Error: ${error.message || 'Failed to process images'}</span>
                    <button class="close-notification"><i class="fas fa-times"></i></button>
                `;
                document.body.appendChild(notification);
                
                // Add close button functionality
                const closeBtn = notification.querySelector('.close-notification');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        notification.remove();
                    });
                }
            }
        }).init();
        
        console.log('Enhanced Phone Scanner initialized successfully');
        
        // Initialize MultiPhotoCapture for enhanced scanner page
        const takeCameraPhotoBtn = document.getElementById('takeCameraPhotoBtn');
        
        // Check if we have the multi-photo capture component available
        if (takeCameraPhotoBtn && typeof MultiPhotoCapture !== 'undefined') {
            // Create multi-photo capture instance
            const multiPhotoCapture = new MultiPhotoCapture({
                onComplete: (files) => {
                    console.log(`Multi-photo capture complete: ${files.length} images captured`);
                    
                    // Pass the files to the scanner for processing
                    scanner.handleFiles(files);
                    
                    // Automatically process after a short delay to allow preview to update
                    setTimeout(() => {
                        if (scanner.files.length > 0 && !scanner.isProcessing) {
                            console.log('Auto-processing multi-captured images with INTSIG API');
                            scanner.processImages();
                        }
                    }, 500);
                },
                onCancel: () => {
                    console.log('Multi-photo capture cancelled');
                }
            });
            
            // Override the camera button click to use multi-photo capture
            takeCameraPhotoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Launch the multi-photo capture UI
                multiPhotoCapture.openCamera();
            });
            
            console.log('Multi-photo capture initialized for enhanced scanner');
        } else {
            console.warn('MultiPhotoCapture not available or camera button not found, falling back to standard camera');
            
            // Fallback to standard camera if multi-photo not available
            const enhancedCameraInput = document.getElementById('enhancedCameraInput');
            
            if (takeCameraPhotoBtn && enhancedCameraInput) {
                takeCameraPhotoBtn.addEventListener('click', () => {
                    enhancedCameraInput.click();
                });
                
                // Automatically process images taken with camera
                enhancedCameraInput.addEventListener('change', () => {
                    if (enhancedCameraInput.files.length > 0) {
                        const files = enhancedCameraInput.files;
                        scanner.handleFiles(files);
                        
                        // Automatically process after a short delay to allow preview to update
                        setTimeout(() => {
                            if (scanner.files.length > 0 && !scanner.isProcessing) {
                                console.log('Auto-processing camera images with INTSIG API');
                                scanner.processImages();
                            }
                        }, 500);
                    }
                });
            }
        }
        
        // Add test images button functionality
        const addEnhancedTestImagesBtn = document.getElementById('addEnhancedTestImagesBtn');
        if (addEnhancedTestImagesBtn) {
            addEnhancedTestImagesBtn.addEventListener('click', () => {
                console.log('Adding test images');
                // Create sample image blobs
                const testImageURLs = [
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                ];
                
                // Convert base64 to blobs and create File objects
                Promise.all(testImageURLs.map((url, index) => 
                    fetch(url)
                        .then(res => res.blob())
                        .then(blob => {
                            return new File([blob], `sample-receipt-${index + 1}.png`, { type: 'image/png' });
                        })
                )).then(files => {
                    scanner.handleFiles(files);
                });
            });
        }
    } catch (error) {
        console.error('Failed to initialize Enhanced Phone Scanner:', error);
    }
});
