/**
 * Service for handling image processing and results
 */
import { processWithSelectedAPI, calculateEstimatedProcessingTime, updateApiCostDisplay, getSelectedApi } from './apiService.js';
import { processFilesForSubmission } from './fileService.js';
import { formatMonetaryValues } from '../utils/dataUtils.js';
import { updateProgressBar, createCountdown } from '../utils/uiUtils.js';
import { queueFilesForGoogleDriveUpload } from './backgroundUploadService.js';
import { uploadBase64ImageToStorage } from './firebaseStorageService.js';
import { auth } from '../firebase-config.js';

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
        
        // Process with selected API or use simulated data if API fails
        onProgress(`Sending to ${getSelectedApi().toUpperCase()} API...`, 20);
        let result;
        try {
            result = await processWithSelectedAPI(base64Files);
        } catch (error) {
            console.warn('Error with API, using simulated data instead:', error);
            // Import the generateSimulatedData function
            const { generateSimulatedData } = await import('../utils/dataUtils.js');
            // Generate simulated data
            result = generateSimulatedData(base64Files);
        }
        
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
                    // No fallback image, just use null for the image URL
                    console.log(`No image data available for index ${index}, using null`);
                    imageUrl = null;
                }
                
                return {
                    ...item,
                    image_url: imageUrl
                };
            });
            
            console.log('Processed images with URLs:', processedImages);
            
            // Queue files for background upload to Google Drive
            // This happens after processing is complete and won't block the UI
            console.log('🚀 [Processing Service] Initiating background upload to Google Drive');
            console.log(`🚀 [Processing Service] Sending ${base64Files.length} files to Google Drive`);
            queueFilesForGoogleDriveUpload(base64Files);
            console.log('✓ [Processing Service] Files queued for Google Drive upload');
            
            // Also upload to Firebase Storage if user is authenticated
            if (auth.currentUser) {
                try {
                    console.log('🚀 [Processing Service] Initiating upload to Firebase Storage');
                    
                    // Get current restaurant/bar ID if available
                    let restaurantId = null;
                    let restaurantName = "Unknown Restaurant";
                    try {
                        const selectedBar = localStorage.getItem('selectedBar');
                        if (selectedBar) {
                            const barData = JSON.parse(selectedBar);
                            restaurantId = barData.id || barData.barId;
                            restaurantName = barData.name || barData.barName || restaurantName;
                        }
                    } catch (error) {
                        console.error('Error getting restaurant ID:', error);
                    }
                    
                    console.log(`📋 [Firebase Upload] Starting batch upload of ${base64Files.length} files to Firebase Storage`);
                    console.log(`📋 [Firebase Upload] User: ${auth.currentUser.email || auth.currentUser.uid}`);
                    console.log(`📋 [Firebase Upload] Restaurant: ${restaurantName} (ID: ${restaurantId || 'none'})`);
                    
                    let successCount = 0;
                    let errorCount = 0;
                    
                    // Upload each file to Firebase Storage
                    for (const fileData of base64Files) {
                        console.log(`📤 [Firebase Upload] Processing file: ${fileData.name}`);
                        
                        try {
                            // Create metadata including restaurant/bar info
                            const metadata = {
                                restaurantId: restaurantId,
                                restaurantName: restaurantName,
                                uploadedAt: new Date().toISOString(),
                                uploadedBy: auth.currentUser.uid,
                                uploadedByEmail: auth.currentUser.email || 'unknown'
                            };
                            
                            // Upload to Firebase Storage
                            await uploadBase64ImageToStorage(fileData, metadata);
                            successCount++;
                            
                            console.log(`✓ [Firebase Upload] Successfully uploaded file ${successCount}/${base64Files.length}`);
                        } catch (error) {
                            console.error(`❌ [Firebase Upload] Error uploading ${fileData.name}:`, error);
                            errorCount++;
                        }
                    }
                    
                    // Log final summary
                    console.log(`🎯 [Firebase Upload] Upload summary:`);
                    console.log(`   ✅ Successfully uploaded: ${successCount}/${base64Files.length} files`);
                    if (errorCount > 0) {
                        console.log(`   ❌ Failed uploads: ${errorCount}`);
                    }
                    
                    // Show notification with results
                    if (successCount > 0) {
                        if (errorCount === 0) {
                            showNotification(`Successfully uploaded ${successCount} images to Firebase Storage`, 'success', 5000);
                        } else {
                            showNotification(`Uploaded ${successCount}/${base64Files.length} images to Firebase Storage (${errorCount} failed)`, 'warning', 5000);
                        }
                    } else if (errorCount > 0) {
                        showNotification(`Failed to upload images to Firebase Storage`, 'error', 5000);
                    }
                    
                    // If user has the profile modal open with images tab, refresh the image viewer
                    const profileModal = document.getElementById('profileModal');
                    if (profileModal && window.getComputedStyle(profileModal).display !== 'none') {
                        const imageViewer = document.querySelector('.firebase-image-viewer');
                        if (imageViewer) {
                            const refreshButton = imageViewer.querySelector('.refresh-button');
                            if (refreshButton) {
                                // Use a small delay to ensure all images are available
                                setTimeout(() => {
                                    refreshButton.click();
                                }, 1000);
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('❌ [Firebase Upload] Error in batch upload process:', error);
                    showNotification('Error uploading images to Firebase Storage', 'error', 5000);
                }
            } else {
                console.log('ℹ️ [Firebase Upload] User not authenticated, skipping Firebase Storage upload');
                showNotification('Log in to save your images to your account', 'info', 5000);
            }
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
