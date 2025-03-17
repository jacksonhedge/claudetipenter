/**
 * Service for handling API communication
 */
import config from '../config.js';
import { generateSimulatedData } from '../utils/dataUtils.js';

/**
 * Process images with Claude API for tip analysis
 * @param {Array} base64Files - Array of base64-encoded files
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
export async function processWithClaudeAPI(base64Files) {
    // Check if we should use the real API or simulated responses
    if (config.api.useRealApi) {
        try {
            // Use the backend proxy server instead of calling Claude API directly
            const apiUrl = config.api.endpoint;
            
            // Prepare the API request to our proxy server
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    images: base64Files,
                    mode: 'tip_analyzer' // Specify this is for tip analysis
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            // The server already processes the Claude API response and returns a structured JSON
            const result = await response.json();
            
            return result;
        } catch (error) {
            console.error('Error calling Claude API:', error);
            
            // Handle any API fetch errors (including CORS errors)
            console.warn(`API Error: ${error.message}`);
            
            // Show a special message about API limitations
            const apiErrorMessage = `
API Error: Unable to access the Claude API. 

This is likely due to one of the following:
1. The API key in the .env file is not set correctly
2. Network connectivity issues
3. The Claude API service is temporarily unavailable
            `;
            
            console.warn(apiErrorMessage);
            
            // Throw the error to be handled by the caller
            throw new Error(`API Error: ${error.message}`);
        }
    } else {
        // Use simulated API response
        
        // Simulate API call with timeout
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateSimulatedData(base64Files));
            }, 2000);
        });
    }
}

/**
 * Process images with Claude API for file organization (without tip analysis)
 * @param {Array} base64Files - Array of base64-encoded files
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
export async function processFilesWithClaudeAPI(base64Files) {
    // Check if we should use the real API or simulated responses
    if (config.api.useRealApi) {
        try {
            // Use the backend proxy server instead of calling Claude API directly
            const apiUrl = config.api.endpoint;
            
            // Prepare the API request to our proxy server
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    images: base64Files,
                    mode: 'file_organizer' // Specify this is for file organization
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            // The server already processes the Claude API response and returns a structured JSON
            const result = await response.json();
            
            return result;
        } catch (error) {
            console.error('Error calling Claude API for file organization:', error);
            
            // Handle any API fetch errors (including CORS errors)
            console.warn(`API Error: ${error.message}`);
            
            // Show a special message about API limitations
            const apiErrorMessage = `
API Error: Unable to access the Claude API. 

This is likely due to one of the following:
1. The API key in the .env file is not set correctly
2. Network connectivity issues
3. The Claude API service is temporarily unavailable
            `;
            
            console.warn(apiErrorMessage);
            
            // Throw the error to be handled by the caller
            throw new Error(`API Error: ${error.message}`);
        }
    } else {
        // Use simulated API response
        
        // Simulate API call with timeout
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate simulated data without tip information
                const data = generateSimulatedData(base64Files);
                
                // Remove tip and total information from the results
                if (data.results) {
                    data.results = data.results.map(item => ({
                        ...item,
                        tip: "N/A",
                        total: item.amount // Use the base amount as the total
                    }));
                }
                
                resolve(data);
            }, 2000);
        });
    }
}

/**
 * Calculates the estimated processing time based on number of images
 * @param {number} imageCount - Number of images to process
 * @returns {number} - Estimated processing time in seconds
 */
export function calculateEstimatedProcessingTime(imageCount) {
    // Base processing time per image (in seconds)
    const baseTimePerImage = 2;
    
    // Additional overhead time (in seconds)
    const overheadTime = 5;
    
    // Calculate total estimated time
    return (imageCount * baseTimePerImage) + overheadTime;
}

/**
 * Updates the API cost display
 * @param {string|number} cost - The API cost to display
 */
export function updateApiCostDisplay(cost) {
    const costValueElement = document.querySelector('.cost-value');
    if (costValueElement && cost) {
        costValueElement.textContent = `$${parseFloat(cost).toFixed(4)}`;
    }
}
