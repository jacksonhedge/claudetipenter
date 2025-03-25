/**
 * Firebase Storage Service
 * Handles uploading and retrieving images from Firebase Storage
 */
import { ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { db, auth, storage } from "../firebase-config.js";
import { doc, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { showNotification } from "../utils/uiUtils.js";

// Storage bucket URL for reference
const STORAGE_BUCKET_URL = 'gs://tipscanner-46c53.appspot.com';

/**
 * Upload image file to Firebase Storage with local fallback for CORS issues
 * @param {File|Blob} file - The file or blob to upload
 * @param {string} fileName - The name of the file
 * @param {Object} metadata - Optional metadata including restaurant/bar info
 * @returns {Promise<Object>} - Promise resolving to the uploaded file metadata
 */
export async function uploadImageToStorage(file, fileName, metadata = {}) {
    try {
        console.log(`📤 [Firebase Storage] Starting upload for file: ${fileName}`);
        
        // If running on localhost, detect potential CORS issues and use local storage fallback
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!auth.currentUser) {
            console.error('❌ [Firebase Storage] User not authenticated');
            throw new Error('User not authenticated');
        }
        
        const userId = auth.currentUser.uid;
        console.log(`✓ [Firebase Storage] Authenticated as user: ${userId}`);
        
        // Create path format: images/{userId}/{restaurantId}/{timestamp}_{filename}
        let folderPath = `images/${userId}`;
        
        // Add restaurant ID to path if available
        if (metadata.restaurantId) {
            folderPath += `/${metadata.restaurantId}`;
        }
        
        // Create unique filename with timestamp
        const timestamp = new Date().getTime();
        const uniqueFileName = `${timestamp}_${fileName}`;
        const fullPath = `${folderPath}/${uniqueFileName}`;
        
        // Create temp URL for localhost testing (avoiding CORS issues)
        let downloadURL;
        let snapshot;
        
        // Try Firebase Storage first, unless we already know we're on localhost (to avoid CORS errors)
        if (!isLocalhost) {
            try {
                // Create reference to the file location in Firebase Storage
                const storageRef = ref(storage, fullPath);
                
                // Add metadata including user ID and restaurant info
                const completeMetadata = {
                    customMetadata: {
                        userId: userId,
                        uploadTimestamp: timestamp.toString(),
                        ...metadata
                    }
                };
                
                console.log(`📋 [Firebase Storage] Uploading with metadata:`, completeMetadata);
                
                // Upload the file
                snapshot = await uploadBytes(storageRef, file, completeMetadata);
                console.log(`✅ [Firebase Storage] Upload successful:`, snapshot);
                
                // Get the download URL
                downloadURL = await getDownloadURL(snapshot.ref);
                console.log(`🔗 [Firebase Storage] Download URL:`, downloadURL);
            } catch (storageError) {
                console.warn('⚠️ [Firebase Storage] Error with Firebase Storage, using local fallback:', storageError);
                
                // Check if this is a CORS error
                if (storageError.message && (
                    storageError.message.includes('CORS') || 
                    storageError.message.includes('NetworkError') ||
                    storageError.message.includes('network error'))) {
                    console.log('⚠️ [Firebase Storage] CORS issue detected, using local fallback');
                    isLocalhost = true; // Force fallback
                } else {
                    // Re-throw non-CORS errors
                    throw storageError;
                }
            }
        }
        
        // Use local storage fallback if we're on localhost or had CORS issues
        if (isLocalhost) {
            // Create a temporary local URL for the image
            const localStoragePrefix = 'tipenter_local_storage_';
            
            // Convert the file to data URL for local storage
            const reader = new FileReader();
            const fileDataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            // Store in localStorage with fallback to memory if file is too large
            try {
                localStorage.setItem(`${localStoragePrefix}${uniqueFileName}`, fileDataUrl);
                console.log(`📦 [Local Storage] Saved ${uniqueFileName} to local storage`);
            } catch (localStorageError) {
                console.warn(`⚠️ [Local Storage] Error saving to localStorage (likely too large): ${localStorageError.message}`);
                console.log(`📦 [Memory Storage] Using in-memory storage instead`);
                
                // Global object to store images in memory during this session
                if (!window.tipenterInMemoryStorage) {
                    window.tipenterInMemoryStorage = {};
                }
                window.tipenterInMemoryStorage[uniqueFileName] = fileDataUrl;
            }
            
            // Create a fake download URL for local testing
            downloadURL = `data:local-storage:${uniqueFileName}`;
            console.log(`🔗 [Local Fallback] Created local reference URL: ${downloadURL}`);
        }
        
        // Display success message in console with details
        console.log(`✅ [Storage] Successfully handled image upload:`);
        console.log(`   📁 Path: ${fullPath}`);
        console.log(`   📄 Filename: ${uniqueFileName}`);
        console.log(`   👤 User: ${userId}`);
        if (metadata.restaurantId) {
            console.log(`   🏢 Restaurant/Bar: ${metadata.restaurantId}`);
        }
        console.log(`   ⏱️ Timestamp: ${new Date(timestamp).toLocaleString()}`);
        console.log(`   💾 Storage: ${isLocalhost ? 'Local Storage Fallback' : 'Firebase Storage'}`);
        
        // Update user document with reference to the uploaded image
        try {
            await updateUserImageReferences(userId, {
                path: fullPath,
                fileName: uniqueFileName,
                downloadURL: downloadURL,
                uploadTimestamp: timestamp,
                metadata: metadata,
                storageType: isLocalhost ? 'local' : 'firebase'
            });
        } catch (refError) {
            console.warn('⚠️ [Firebase Storage] Could not update user document, but upload was successful', refError);
        }
        
        // Show notification to user
        const storageType = isLocalhost ? 'Local Storage' : 'Firebase Storage';
        showNotification(`Image successfully uploaded to ${storageType}`, 'success', 3000);
        
        return {
            path: fullPath,
            downloadURL: downloadURL,
            fileName: uniqueFileName,
            uploadTimestamp: timestamp,
            storageType: isLocalhost ? 'local' : 'firebase'
        };
    } catch (error) {
        console.error('❌ [Storage] Error uploading image:', error);
        showNotification(`Error uploading image: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Update user document with reference to uploaded image
 * @param {string} userId - The user ID
 * @param {Object} imageRef - The image reference data
 */
async function updateUserImageReferences(userId, imageRef) {
    try {
        console.log(`📝 [Firebase Storage] Updating user document with image reference`);
        
        const userDocRef = doc(db, "users", userId);
        
        // Check if user document exists
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            try {
                // Update existing document
                await updateDoc(userDocRef, {
                    uploadedImages: arrayUnion(imageRef)
                });
                console.log(`✅ [Firebase Storage] User document updated with image reference`);
            } catch (updateError) {
                // Check if this is a permission error
                if (updateError.code === 'permission-denied' || 
                    updateError.message.includes('Missing or insufficient permissions')) {
                    console.warn('⚠️ [Firebase Storage] Permission error detected when updating user document, using local storage fallback');
                    
                    // Store the image reference in local storage instead
                    try {
                        // Get existing references from local storage
                        const localStorageKey = `tipenter_user_images_${userId}`;
                        let existingRefs = [];
                        
                        try {
                            const storedRefs = localStorage.getItem(localStorageKey);
                            if (storedRefs) {
                                existingRefs = JSON.parse(storedRefs);
                            }
                        } catch (parseError) {
                            console.warn('Error parsing stored image references:', parseError);
                        }
                        
                        // Add the new reference
                        existingRefs.push(imageRef);
                        
                        // Store back in local storage
                        localStorage.setItem(localStorageKey, JSON.stringify(existingRefs));
                        console.log(`✅ [Firebase Storage] Image reference saved to local storage instead of Firestore`);
                    } catch (localStorageError) {
                        console.error('❌ [Firebase Storage] Error saving image reference to local storage:', localStorageError);
                    }
                } else {
                    // Re-throw other errors
                    throw updateError;
                }
            }
        } else {
            console.warn(`⚠️ [Firebase Storage] User document not found for ID: ${userId}, using local storage instead`);
            
            // If document doesn't exist, store in local storage
            const localStorageKey = `tipenter_user_images_${userId}`;
            let existingRefs = [];
            
            try {
                const storedRefs = localStorage.getItem(localStorageKey);
                if (storedRefs) {
                    existingRefs = JSON.parse(storedRefs);
                }
            } catch (parseError) {
                console.warn('Error parsing stored image references:', parseError);
            }
            
            // Add the new reference
            existingRefs.push(imageRef);
            
            // Store back in local storage
            localStorage.setItem(localStorageKey, JSON.stringify(existingRefs));
            console.log(`✅ [Firebase Storage] Image reference saved to local storage (no Firestore document)`);
        }
    } catch (error) {
        console.error('❌ [Firebase Storage] Error updating user document:', error);
        
        // Fallback to local storage for any errors
        try {
            const localStorageKey = `tipenter_user_images_${userId}`;
            let existingRefs = [];
            
            try {
                const storedRefs = localStorage.getItem(localStorageKey);
                if (storedRefs) {
                    existingRefs = JSON.parse(storedRefs);
                }
            } catch (parseError) {
                console.warn('Error parsing stored image references:', parseError);
            }
            
            // Add the new reference
            existingRefs.push(imageRef);
            
            // Store back in local storage
            localStorage.setItem(localStorageKey, JSON.stringify(existingRefs));
            console.log(`✅ [Firebase Storage] Image reference saved to local storage as final fallback`);
        } catch (localStorageError) {
            console.error('❌ [Firebase Storage] Final fallback to local storage failed:', localStorageError);
        }
    }
}

/**
 * Export base64 image data to Firebase Storage
 * @param {Object} imageData - Object containing image data in base64 format
 * @param {string} imageData.data - Base64 encoded image data
 * @param {string} imageData.name - Image filename
 * @param {string} imageData.type - Image MIME type
 * @param {Object} metadata - Optional metadata including restaurant/bar info
 * @returns {Promise<Object>} - Promise resolving to the uploaded file metadata
 */
export async function uploadBase64ImageToStorage(imageData, metadata = {}) {
    try {
        console.log(`🔄 [Firebase Storage] Converting base64 to Blob for ${imageData.name}`);
        
        // Convert base64 to Blob
        const byteCharacters = atob(imageData.data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: imageData.type });
        console.log(`✓ [Firebase Storage] Created Blob: size: ${blob.size} bytes`);
        
        // Upload the blob
        return await uploadImageToStorage(blob, imageData.name, metadata);
    } catch (error) {
        console.error('❌ [Firebase Storage] Error uploading base64 image:', error);
        throw error;
    }
}

/**
 * Export images to Firebase Storage
 * @param {Array} images - Array of image data objects to export
 * @param {string} barId - ID of the bar associated with the images
 * @param {string} exportType - Type of export (email, pdf, text)
 * @returns {Promise<Array>} - Promise resolving to array of exported image URLs
 */
export async function exportImagesToStorage(images, barId, exportType = 'pdf') {
    try {
        if (!auth.currentUser) {
            console.error('❌ [Firebase Storage] User not authenticated');
            throw new Error('User not authenticated');
        }
        
        if (!barId) {
            console.error('❌ [Firebase Storage] Bar ID is required for export');
            throw new Error('Bar ID is required');
        }
        
        const userId = auth.currentUser.uid;
        console.log(`✓ [Firebase Storage] Exporting ${images.length} images for user: ${userId} and bar: ${barId}`);
        
        // Create a unique export ID
        const exportId = `export_${Date.now()}`;
        
        // Store URLs of exported images
        const exportedUrls = [];
        
        // Process each image
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            try {
                // Skip if no image URL
                if (!image.image_url) {
                    console.warn(`⚠️ [Firebase Storage] Skipping image ${i} - no URL`);
                    continue;
                }
                
                // Handle data URLs (local storage)
                if (image.image_url.startsWith('data:')) {
                    // Extract the base64 data and MIME type
                    const matches = image.image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    
                    if (matches && matches.length === 3) {
                        const imageType = matches[1];
                        const imageData = matches[2];
                        
                        // Create a unique filename
                        const filename = `receipt_${i}_${Date.now()}.png`;
                        
                        // Create metadata with receipt data
                        const metadata = {
                            barId: barId,
                            exportId: exportId,
                            exportType: exportType,
                            receiptData: JSON.stringify(image)
                        };
                        
                        // Upload to storage
                        const result = await uploadBase64ImageToStorage({
                            data: imageData,
                            name: filename,
                            type: imageType
                        }, metadata);
                        
                        exportedUrls.push(result.downloadURL);
                        console.log(`✅ [Firebase Storage] Exported image ${i + 1}/${images.length}`);
                    } else {
                        console.warn(`⚠️ [Firebase Storage] Invalid data URL format for image ${i}`);
                    }
                } else {
                    // For remote URLs, fetch the image and then upload
                    try {
                        const response = await fetch(image.image_url);
                        const blob = await response.blob();
                        
                        // Create a unique filename
                        const filename = `receipt_${i}_${Date.now()}.png`;
                        
                        // Create metadata with receipt data
                        const metadata = {
                            barId: barId,
                            exportId: exportId,
                            exportType: exportType,
                            receiptData: JSON.stringify(image)
                        };
                        
                        // Upload to storage
                        const result = await uploadImageToStorage(blob, filename, metadata);
                        
                        exportedUrls.push(result.downloadURL);
                        console.log(`✅ [Firebase Storage] Exported image ${i + 1}/${images.length}`);
                    } catch (fetchError) {
                        console.error(`❌ [Firebase Storage] Error fetching image: ${fetchError.message}`);
                    }
                }
            } catch (imageError) {
                console.error(`❌ [Firebase Storage] Error processing image ${i}: ${imageError.message}`);
            }
        }
        
        console.log(`✅ [Firebase Storage] Export complete. Exported ${exportedUrls.length}/${images.length} images`);
        return exportedUrls;
    } catch (error) {
        console.error('❌ [Firebase Storage] Error exporting images:', error);
        throw error;
    }
}

/**
 * Get all images for the current user
 * @returns {Promise<Array>} - Promise resolving to array of image metadata
 */
export async function getUserImages() {
    try {
        if (!auth.currentUser) {
            console.error('❌ [Firebase Storage] User not authenticated');
            throw new Error('User not authenticated');
        }
        
        const userId = auth.currentUser.uid;
        console.log(`✓ [Firebase Storage] Getting images for user: ${userId}`);
        
        // Create reference to the user's images folder
        const folderRef = ref(storage, `images/${userId}`);
        
        // List all items in the folder
        const result = await listAll(folderRef);
        
        // Get download URLs and metadata for each item
        const images = await Promise.all(
            result.items.map(async (itemRef) => {
                const downloadURL = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    path: itemRef.fullPath,
                    downloadURL: downloadURL
                };
            })
        );
        
        console.log(`✅ [Firebase Storage] Retrieved ${images.length} images for user`);
        return images;
    } catch (error) {
        console.error('❌ [Firebase Storage] Error getting user images:', error);
        throw error;
    }
}

/**
 * Get images for a specific restaurant/bar
 * @param {string} restaurantId - The restaurant/bar ID
 * @returns {Promise<Array>} - Promise resolving to array of image metadata
 */
export async function getRestaurantImages(restaurantId) {
    try {
        if (!auth.currentUser) {
            console.error('❌ [Firebase Storage] User not authenticated');
            throw new Error('User not authenticated');
        }
        
        const userId = auth.currentUser.uid;
        console.log(`✓ [Firebase Storage] Getting images for restaurant: ${restaurantId}`);
        
        // Create reference to the restaurant's images folder
        const folderRef = ref(storage, `images/${userId}/${restaurantId}`);
        
        // List all items in the folder
        const result = await listAll(folderRef);
        
        // Get download URLs and metadata for each item
        const images = await Promise.all(
            result.items.map(async (itemRef) => {
                const downloadURL = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    path: itemRef.fullPath,
                    downloadURL: downloadURL
                };
            })
        );
        
        console.log(`✅ [Firebase Storage] Retrieved ${images.length} images for restaurant ${restaurantId}`);
        return images;
    } catch (error) {
        console.error(`❌ [Firebase Storage] Error getting restaurant images: ${error}`);
        throw error;
    }
}
