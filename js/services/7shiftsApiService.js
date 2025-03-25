/**
 * 7shifts API Service
 * This service handles API requests to the 7shifts API
 */

// Base URL for 7shifts API
const BASE_URL = 'https://api.7shifts.com/v2';

/**
 * Make a request to the 7shifts API
 * @param {string} endpoint - The API endpoint to call
 * @param {string} method - The HTTP method to use (GET, POST, PUT, DELETE)
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function make7shiftsApiRequest(endpoint, method, apiKey, params = {}) {
    try {
        // Construct the URL
        const url = `${BASE_URL}/${endpoint}`;
        
        // Set up the request options
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };
        
        // Add body for POST and PUT requests
        if (method === 'POST' || method === 'PUT') {
            options.body = JSON.stringify(params);
        }
        
        // Add query parameters for GET and DELETE requests
        let queryUrl = url;
        if ((method === 'GET' || method === 'DELETE') && Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            for (const key in params) {
                queryParams.append(key, params[key]);
            }
            queryUrl = `${url}?${queryParams.toString()}`;
        }
        
        // Make the request
        const response = await fetch(queryUrl, options);
        
        // Parse the response
        const data = await response.json();
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred while making the request');
        }
        
        return {
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('Error making 7shifts API request:', error);
        return {
            status: 500,
            error: error.message
        };
    }
}

/**
 * Get users from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getUsers(apiKey, params = {}) {
    return make7shiftsApiRequest('users', 'GET', apiKey, params);
}

/**
 * Get shifts from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getShifts(apiKey, params = {}) {
    return make7shiftsApiRequest('shifts', 'GET', apiKey, params);
}

/**
 * Get departments from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getDepartments(apiKey, params = {}) {
    return make7shiftsApiRequest('departments', 'GET', apiKey, params);
}

/**
 * Get locations from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getLocations(apiKey, params = {}) {
    return make7shiftsApiRequest('locations', 'GET', apiKey, params);
}

/**
 * Get roles from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getRoles(apiKey, params = {}) {
    return make7shiftsApiRequest('roles', 'GET', apiKey, params);
}

/**
 * Get time punches from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getTimePunches(apiKey, params = {}) {
    return make7shiftsApiRequest('time_punches', 'GET', apiKey, params);
}

/**
 * Get time off requests from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getTimeOff(apiKey, params = {}) {
    return make7shiftsApiRequest('time_off', 'GET', apiKey, params);
}

/**
 * Get availability from the 7shifts API
 * @param {string} apiKey - The 7shifts API key
 * @param {Object} params - The parameters to send with the request
 * @returns {Promise<Object>} - The API response
 */
export async function getAvailability(apiKey, params = {}) {
    return make7shiftsApiRequest('availability', 'GET', apiKey, params);
}
