/**
 * Scanner Multi-Photo Integration with Firing Line Mode
 * This script integrates firing line mode functionality into the scanner
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Scanner Firing Line Mode...');
    
    // Check if we're on the scanner page
    const isScannerPage = window.location.href.includes('scanner.html') || 
                          document.getElementById('tip-analyzer-tab') !== null;
    
    if (!isScannerPage) {
        console.log('Not on scanner page, skipping firing line initialization');
        return;
    }
    
    // Elements
    const cameraInput = document.getElementById('cameraInput');
    const cameraLabel = document.querySelector('label[for="cameraInput"]');
    const firingLineMode = document.getElementById('firingLineMode');
    const firingLineExit = document.getElementById('firingLineExit');
    const firingLineCapture = document.getElementById('firingLineCapture');
    const firingLineCounter = document.getElementById('firingLineCounter');
    const firingLineFlash = document.getElementById('firingLineFlash');
    const cameraFeed = document.getElementById('cameraFeed');
    
    // Check if required elements exist
    if (!cameraInput || !cameraLabel || !firingLineMode) {
        console.error('Required elements for firing line mode not found');
        return;
    }
    
    // Variables
    let mediaStream = null;
    let capturedImages = [];
    
    // Function to open firing line mode
    const openFiringLineMode = async () => {
        try {
            // Request camera access
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' },
                audio: false 
            });
            
            // Set video source
            cameraFeed.srcObject = mediaStream;
            
            // Reset captured images
            capturedImages = [];
            firingLineCounter.textContent = '0 images';
            
            // Show firing line mode
            firingLineMode.style.display = 'flex';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions and try again.');
        }
    };
    
    // Function to capture an image in firing line mode
    const captureImage = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(function(blob) {
            // Create file from blob
            const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Add file to captured images
            capturedImages.push(file);
            
            // Update counter
            firingLineCounter.textContent = `${capturedImages.length} image${capturedImages.length !== 1 ? 's' : ''}`;
            
            // Show flash effect
            firingLineFlash.style.opacity = '1';
            setTimeout(() => {
                firingLineFlash.style.opacity = '0';
            }, 100);
            
        }, 'image/jpeg', 0.9);
    };
    
    // Function to close firing line mode
    const closeFiringLineMode = () => {
        // Stop media stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        // Hide firing line mode
        firingLineMode.style.display = 'none';
        
        // If we have captured images, process them with the scanner
        if (capturedImages.length > 0) {
            // Get the FileUploader instance from window.appComponents
            const fileUploader = window.appComponents?.fileUploader;
            if (!fileUploader) {
                console.error('FileUploader instance not found');
                return;
            }
            
            // Add the files to the uploader
            capturedImages.forEach(file => {
                fileUploader.createFilePreview(file, file.name);
            });
            
            // Automatically process after a short delay to allow preview to update
            setTimeout(() => {
                // Check if process button exists and enable it
                const processBtn = document.getElementById('processBtn');
                if (processBtn && !processBtn.disabled) {
                    console.log(`Auto-processing ${capturedImages.length} images from firing line mode`);
                    processBtn.click();
                }
            }, 500);
        }
    };
    
    // Add event listeners
    cameraLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Launch firing line mode
        openFiringLineMode();
    });
    
    firingLineCapture.addEventListener('click', captureImage);
    firingLineExit.addEventListener('click', closeFiringLineMode);
    
    console.log('Scanner Firing Line Mode initialized successfully');
});
