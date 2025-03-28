/**
 * Scanner Multi-Photo Integration
 * This script integrates multi-photo capture functionality into the main scanner
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Scanner Multi-Photo Capture...');
    
    // Check if we're on the scanner page
    const isScannerPage = window.location.href.includes('scanner.html') || 
                          document.getElementById('tip-analyzer-tab') !== null;
    
    if (!isScannerPage) {
        console.log('Not on scanner page, skipping multi-photo initialization');
        return;
    }
    
    // Elements
    const cameraInput = document.getElementById('cameraInput');
    const cameraLabel = document.querySelector('label[for="cameraInput"]');
    
    // Check if required elements exist
    if (!cameraInput || !cameraLabel) {
        console.error('Required elements for multi-photo capture not found');
        return;
    }
    
    // Initialize Multi-Photo Capture
    let multiPhotoCapture;
    
    // Check if the MultiPhotoCapture class is available
    if (typeof MultiPhotoCapture === 'undefined') {
        console.error('MultiPhotoCapture class not loaded. Include multi-photo-capture.js script.');
        return;
    }
    
    // Create a multi-photo capture instance
    multiPhotoCapture = new MultiPhotoCapture({
        onComplete: (files) => {
            console.log(`Multi-photo capture complete: ${files.length} images captured`);
            
            // Get the FileUploader instance from window.appComponents
            const fileUploader = window.appComponents?.fileUploader;
            if (!fileUploader) {
                console.error('FileUploader instance not found');
                return;
            }
            
            // Add the files to the uploader
            files.forEach(file => {
                fileUploader.createFilePreview(file, file.name);
            });
            
            // Automatically process after a short delay to allow preview to update
            if (files.length > 0) {
                setTimeout(() => {
                    // Check if process button exists and enable it
                    const processBtn = document.getElementById('processBtn');
                    if (processBtn && !processBtn.disabled) {
                        console.log('Auto-processing multi-captured images');
                        processBtn.click();
                    }
                }, 500);
            }
        },
        onCancel: () => {
            console.log('Multi-photo capture cancelled');
        }
    });
    
    // Override the camera button click to use multi-photo capture
    cameraLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Open the multi-photo capture interface
        multiPhotoCapture.openCamera();
    });
    
    console.log('Scanner Multi-Photo Capture initialized successfully');
});
