/**
 * 7shifts API Playground Component
 * This component handles the UI interactions for the 7shifts API playground
 */

import {
    make7shiftsApiRequest,
    getUsers,
    getShifts,
    getDepartments,
    getLocations,
    getRoles,
    getTimePunches,
    getTimeOff,
    getAvailability
} from '../services/7shiftsApiService.js';

// Initialize the 7shifts API playground
export function init7shiftsPlayground() {
    console.log('Initializing 7shifts API playground...');
    
    // DOM Elements
    const endpointSelect = document.getElementById('7shifts-endpoint');
    const methodSelect = document.getElementById('7shifts-method');
    const apiKeyInput = document.getElementById('7shifts-api-key');
    const paramsTextarea = document.getElementById('7shifts-params');
    const testButton = document.getElementById('7shifts-test-btn');
    const responseElement = document.getElementById('7shifts-response');
    
    // Check if elements exist
    if (!endpointSelect || !methodSelect || !apiKeyInput || !paramsTextarea || !testButton || !responseElement) {
        console.error('One or more 7shifts API playground elements not found');
        return;
    }
    
    // Load saved API key from localStorage if available
    const savedApiKey = localStorage.getItem('7shifts_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
    
    // Handle endpoint change
    endpointSelect.addEventListener('change', () => {
        // Update placeholder with example parameters for the selected endpoint
        updateParamsPlaceholder(endpointSelect.value);
    });
    
    // Set initial placeholder
    updateParamsPlaceholder(endpointSelect.value);
    
    // Handle test button click
    testButton.addEventListener('click', async () => {
        // Show loading state
        responseElement.textContent = 'Loading...';
        testButton.disabled = true;
        
        try {
            // Get values from form
            const endpoint = endpointSelect.value;
            const method = methodSelect.value;
            const apiKey = apiKeyInput.value.trim();
            let params = {};
            
            // Parse parameters if provided
            if (paramsTextarea.value.trim()) {
                try {
                    params = JSON.parse(paramsTextarea.value);
                } catch (error) {
                    responseElement.textContent = `Error parsing parameters: ${error.message}`;
                    testButton.disabled = false;
                    return;
                }
            }
            
            // Save API key to localStorage
            if (apiKey) {
                localStorage.setItem('7shifts_api_key', apiKey);
            }
            
            // Make API request
            let response;
            
            switch (endpoint) {
                case 'users':
                    response = await getUsers(apiKey, params);
                    break;
                case 'shifts':
                    response = await getShifts(apiKey, params);
                    break;
                case 'departments':
                    response = await getDepartments(apiKey, params);
                    break;
                case 'locations':
                    response = await getLocations(apiKey, params);
                    break;
                case 'roles':
                    response = await getRoles(apiKey, params);
                    break;
                case 'time_punches':
                    response = await getTimePunches(apiKey, params);
                    break;
                case 'time_off':
                    response = await getTimeOff(apiKey, params);
                    break;
                case 'availability':
                    response = await getAvailability(apiKey, params);
                    break;
                default:
                    // Use the generic API request function for custom endpoints
                    response = await make7shiftsApiRequest(endpoint, method, apiKey, params);
            }
            
            // Display response
            responseElement.textContent = JSON.stringify(response, null, 2);
        } catch (error) {
            // Display error
            responseElement.textContent = `Error: ${error.message}`;
        } finally {
            // Re-enable test button
            testButton.disabled = false;
        }
    });
    
    // Function to update the parameters placeholder based on the selected endpoint
    function updateParamsPlaceholder(endpoint) {
        let placeholder = '';
        
        switch (endpoint) {
            case 'users':
                placeholder = '{\n  "location_id": 123\n}';
                break;
            case 'shifts':
                placeholder = '{\n  "location_id": 123,\n  "start_date": "2025-03-24",\n  "end_date": "2025-03-31"\n}';
                break;
            case 'departments':
                placeholder = '{\n  "location_id": 123\n}';
                break;
            case 'locations':
                placeholder = '{\n  "company_id": 123\n}';
                break;
            case 'roles':
                placeholder = '{\n  "location_id": 123\n}';
                break;
            case 'time_punches':
                placeholder = '{\n  "location_id": 123,\n  "start_date": "2025-03-24",\n  "end_date": "2025-03-31"\n}';
                break;
            case 'time_off':
                placeholder = '{\n  "location_id": 123,\n  "start_date": "2025-03-24",\n  "end_date": "2025-03-31"\n}';
                break;
            case 'availability':
                placeholder = '{\n  "user_id": 123\n}';
                break;
            default:
                placeholder = '{\n  "key": "value"\n}';
        }
        
        paramsTextarea.placeholder = placeholder;
    }
}
