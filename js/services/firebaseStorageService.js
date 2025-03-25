/**
 * Firebase Storage Service
 * Handles uploading and retrieving images from Firebase Storage
 */
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { db, auth } from "../firebase-config.js";
import { doc, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { showNotification } from "../utils/uiUtils.js";

// Initialize Firebase Storage
const storage = getStorage();

/**
 * Upload image file to Firebase Storage
 * @param {File|Blob} file - The file or blob to upload
 * @param {string} fileName - The name of the file
 * @param {Object} metadata - Optional metadata including restaurant/bar info
 * @returns {Promise<Object>} - Promise resolving to the uploaded file metadata
 */
export async function uploadImageToStorage(file, fileName, metadata = {}) {
    try {
        console.log(`📤 [Firebase Storage] Starting upload for file: ${fileName}`);
        
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
        const snapshot = await uploadBytes(storageRef, file, completeMetadata);
        console.log(`✅ [Firebase Storage] Upload successful:`, snapshot);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`🔗 [Firebase Storage] Download URL:`, downloadURL);
        
        // Display success message in console with details
        console.log(`✅ [Firebase Storage] Successfully uploaded image to Firebase:`);
        console.log(`   📁 Path: ${fullPath}`);
        console.log(`   📄 Filename: ${uniqueFileName}`);
        console.log(`   👤 User: ${userId}`);
        if (metadata.restaurantId) {
            console.log(`   🏢 Restaurant/Bar: ${metadata.restaurantId}`);
        }
        console.log(`   ⏱️ Timestamp: ${new Date(timestamp).toLocaleString()}`);
        
        // Update user document with reference to the uploaded image
        await updateUserImageReferences(userId, {
            path: fullPath,
            fileName: uniqueFileName,
            downloadURL: downloadURL,
            uploadTimestamp: timestamp,
            metadata: metadata
        });
        
        // Show notification to user
        showNotification('Image successfully uploaded to Firebase Storage', 'success', 3000);
        
        return {
            path: fullPath,
            downloadURL: downloadURL,
            fileName: uniqueFileName,
            uploadTimestamp: timestamp
        };
    } catch (error) {
        console.error('❌ [Firebase Storage] Error uploading image:', error);
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
            // Update existing document
            await updateDoc(userDocRef, {
                uploadedImages: arrayUnion(imageRef)
            });
            console.log(`✅ [Firebase Storage] User document updated with image reference`);
        } else {
            console.error(`❌ [Firebase Storage] User document not found for ID: ${userId}`);
        }
    } catch (error) {
        console.error('❌ [Firebase Storage] Error updating user document:', error);
    }
}

/**
 * Upload base64 image data to Firebase Storage
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
