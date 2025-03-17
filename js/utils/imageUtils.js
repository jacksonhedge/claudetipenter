/**
 * Utility functions for image handling and processing
 */

/**
 * Compresses and converts a file to base64 format
 * @param {File} file - The file to compress and convert
 * @returns {Promise<Object>} - Promise resolving to an object with name, type, and base64 data
 */
export async function compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        // Create canvas for image compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create image object
        const img = new Image();
        
        // Set up image load handler
        img.onload = () => {
            // Calculate new dimensions (max 1200px width/height while maintaining aspect ratio)
            let width = img.width;
            let height = img.height;
            const maxDimension = 1200;
            
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            
            // Resize image
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get compressed image as base64
            const quality = 0.8; // 80% quality, good balance between size and quality
            const base64String = canvas.toDataURL(file.type, quality).split(',')[1];
            
            resolve({
                name: file.name,
                type: file.type,
                data: base64String
            });
        };
        
        // Handle errors
        img.onerror = () => {
            // Fall back to regular base64 conversion if compression fails
            fileToBase64(file).then(resolve).catch(reject);
        };
        
        // Only try to compress image files
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        } else {
            // For non-image files, use regular base64 conversion
            fileToBase64(file).then(resolve).catch(reject);
        }
    });
}

/**
 * Converts a file to base64 format without compression
 * @param {File} file - The file to convert
 * @returns {Promise<Object>} - Promise resolving to an object with name, type, and base64 data
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve({
                name: file.name,
                type: file.type,
                data: base64String
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
