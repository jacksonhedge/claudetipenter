/**
 * Service for handling image processing and results
 */
import { processWithClaudeAPI, calculateEstimatedProcessingTime, updateApiCostDisplay } from './apiService.js';
import { processFilesForSubmission } from './fileService.js';
import { formatMonetaryValues } from '../utils/dataUtils.js';
import { updateProgressBar, createCountdown } from '../utils/uiUtils.js';

// Store current data for sorting and filtering
let currentData = null;
let processedImages = [];

/**
 * Process selected files and extract receipt data
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {HTMLElement} countdownTimer - The countdown timer element
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onComplete - Callback for completion
 * @returns {Promise<Object>} - Promise resolving to the processed data
 */
export async function processImages(progressBar, countdownTimer, onProgress, onComplete) {
    try {
        // Update progress bar to show start
        updateProgressBar(progressBar, 0);
        
        // Compress and convert files to base64
        onProgress('Preparing files...', 10);
        const base64Files = await processFilesForSubmission();
        
        if (base64Files.length === 0) {
            throw new Error('No valid files to process');
        }
        
        // Set up countdown timer
        const estimatedTime = calculateEstimatedProcessingTime(base64Files.length);
        const countdown = createCountdown(countdownTimer, estimatedTime);
        countdown.start();
        
        // Process with Claude API
        onProgress('Sending to API...', 20);
        const result = await processWithClaudeAPI(base64Files);
        
        // Format monetary values
        onProgress('Formatting results...', 90);
        const formattedResult = formatMonetaryValues(result);
        
        // Update API cost display if available
        if (formattedResult.api_cost && formattedResult.api_cost.total_cost) {
            updateApiCostDisplay(formattedResult.api_cost.total_cost);
        }
        
        // Store the current data for sorting and filtering
        currentData = formattedResult;
        
        // Store processed images for organized tab
        if (formattedResult && formattedResult.results) {
            console.log('Processing images for organized tab:', formattedResult.results);
            console.log('Base64 files available:', base64Files);
            
            // Map the results to include image URLs
            processedImages = formattedResult.results.map((item, index) => {
                // Use the actual uploaded image if available
                let imageUrl;
                
                if (base64Files && base64Files[index] && base64Files[index].data) {
                    // Use the actual uploaded image
                    imageUrl = `data:${base64Files[index].type};base64,${base64Files[index].data}`;
                    console.log(`Using actual image for index ${index}`);
                } else {
                    // Fallback to a colored rectangle if no image is available
                    console.log(`No image data available for index ${index}, using fallback`);
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
                
                return {
                    ...item,
                    image_url: imageUrl
                };
            });
            
            console.log('Processed images with URLs:', processedImages);
        }
        
        // Complete progress bar
        onProgress('Complete!', 100);
        
        // Stop countdown
        countdown.stop();
        
        // Call completion callback
        if (onComplete) {
            onComplete(formattedResult);
        }
        
        return formattedResult;
    } catch (error) {
        console.error('Error processing images:', error);
        throw error;
    }
}

/**
 * Get the current processed data
 * @returns {Object} - The current processed data
 */
export function getCurrentData() {
    return currentData;
}

/**
 * Get all processed images
 * @returns {Array} - Array of processed image data
 */
export function getProcessedImages() {
    return processedImages;
}

/**
 * Set the current processed data
 * @param {Object} data - The data to set
 */
export function setCurrentData(data) {
    currentData = data;
}

/**
 * Generate sample images for testing
 * @param {number} count - Number of sample images to generate
 * @param {Function} onImageGenerated - Callback for each generated image
 */
export function generateSampleImages(count, onImageGenerated) {
    // Create sample image objects
    for (let i = 1; i <= count; i++) {
        // Create a mock File object with varied file sizes (5-20KB)
        const fileSize = Math.floor(Math.random() * 15 + 5) * 1024;
        
        // Create varied filenames with different formats
        let fileName;
        const fileType = Math.random() > 0.3 ? 'jpeg' : 'png';
        
        // Create more realistic file names
        if (i % 5 === 0) {
            fileName = `receipt_${Math.floor(Math.random() * 10000)}.${fileType}`;
        } else if (i % 7 === 0) {
            fileName = `check_${Math.floor(Math.random() * 5000)}.${fileType}`;
        } else if (i % 3 === 0) {
            fileName = `IMG_${Math.floor(Math.random() * 9000) + 1000}.${fileType}`;
        } else {
            fileName = `sample_image_${i}.${fileType}`;
        }
        
        const mockFile = new File(
            [new ArrayBuffer(fileSize)],
            fileName,
            { type: `image/${fileType}` }
        );
        
        // Call the callback for this file
        if (onImageGenerated) {
            onImageGenerated(mockFile);
        }
    }
}
