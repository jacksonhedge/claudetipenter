/**
 * Client-side JavaScript for interacting with Epson Connect API
 * 
 * This file provides functions to interact with the Epson Connect API
 * through our server-side proxy endpoints.
 */

// Namespace for Epson Connect API client functions
const EpsonClient = {
    
    /**
     * Get scan destinations from Epson Connect API
     * @returns {Promise} - Promise resolving to scan destinations
     */
    getScanDestinations: function() {
        return new Promise((resolve, reject) => {
            console.log('Requesting scan destinations from server...');
            $.ajax({
                url: '/api/epson/scan/destinations',
                method: 'GET',
                success: function(response) {
                    console.log('Received scan destinations response:', response);
                    if (response.success === false) {
                        reject(new Error(response.error || 'Unknown error'));
                    } else {
                        resolve(response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error when getting scan destinations:', xhr, status, error);
                    let errorMessage = 'Failed to get scan destinations';
                    
                    // Try to get more detailed error information
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage += ': ' + xhr.responseJSON.error;
                    } else if (xhr.responseText) {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.error) {
                                errorMessage += ': ' + errorResponse.error;
                            }
                        } catch (e) {
                            // If we can't parse the response, just use the status and error
                            errorMessage += ': ' + status + ' - ' + error;
                        }
                    } else if (error) {
                        errorMessage += ': ' + error;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });
        });
    },
    
    /**
     * Start a scan job
     * @param {Object} scanSettings - Scan settings (resolution, color mode, etc.)
     * @returns {Promise} - Promise resolving to scan job information
     */
    startScanJob: function(scanSettings) {
        return new Promise((resolve, reject) => {
            console.log('Starting scan job with settings:', scanSettings);
            $.ajax({
                url: '/api/epson/scan/jobs',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(scanSettings),
                success: function(response) {
                    console.log('Received scan job response:', response);
                    if (response.success === false) {
                        reject(new Error(response.error || 'Unknown error'));
                    } else {
                        resolve(response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error when starting scan job:', xhr, status, error);
                    let errorMessage = 'Failed to start scan job';
                    
                    // Try to get more detailed error information
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage += ': ' + xhr.responseJSON.error;
                    } else if (xhr.responseText) {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.error) {
                                errorMessage += ': ' + errorResponse.error;
                            }
                        } catch (e) {
                            // If we can't parse the response, just use the status and error
                            errorMessage += ': ' + status + ' - ' + error;
                        }
                    } else if (error) {
                        errorMessage += ': ' + error;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });
        });
    },
    
    /**
     * Get scan job status
     * @param {string} jobId - ID of the scan job
     * @returns {Promise} - Promise resolving to scan job status
     */
    getScanJobStatus: function(jobId) {
        return new Promise((resolve, reject) => {
            console.log('Getting scan job status for job:', jobId);
            $.ajax({
                url: `/api/epson/scan/jobs/${jobId}`,
                method: 'GET',
                success: function(response) {
                    console.log('Received scan job status response:', response);
                    if (response.success === false) {
                        reject(new Error(response.error || 'Unknown error'));
                    } else {
                        resolve(response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error when getting scan job status:', xhr, status, error);
                    let errorMessage = 'Failed to get scan job status';
                    
                    // Try to get more detailed error information
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage += ': ' + xhr.responseJSON.error;
                    } else if (xhr.responseText) {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.error) {
                                errorMessage += ': ' + errorResponse.error;
                            }
                        } catch (e) {
                            // If we can't parse the response, just use the status and error
                            errorMessage += ': ' + status + ' - ' + error;
                        }
                    } else if (error) {
                        errorMessage += ': ' + error;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });
        });
    },
    
    /**
     * Example of direct Epson Connect API call (for reference only)
     * This would require the device token and API key to be available on the client side,
     * which is not recommended for security reasons. Use the server-side proxy endpoints instead.
     * 
     * @param {string} deviceToken - Device token for authentication
     * @param {string} apiKey - API key for Epson Connect API
     * @returns {Promise} - Promise resolving to scan destinations
     */
    directGetScanDestinations: function(deviceToken, apiKey) {
        return new Promise((resolve, reject) => {
            console.log('Making direct request to Epson Connect API for scan destinations...');
            $.ajax({
                url: "https://api.epsonconnect.com/api/2/scanning/destinations",
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${deviceToken}`,
                    "x-api-key": apiKey
                },
                success: function(response) {
                    console.log('Received direct scan destinations response:', response);
                    if (response.success === false) {
                        reject(new Error(response.error || 'Unknown error'));
                    } else {
                        resolve(response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error when making direct API call:', xhr, status, error);
                    let errorMessage = 'Direct API error';
                    
                    // Try to get more detailed error information
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage += ': ' + xhr.responseJSON.error;
                    } else if (xhr.responseText) {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.error) {
                                errorMessage += ': ' + errorResponse.error;
                            }
                        } catch (e) {
                            // If we can't parse the response, just use the status and error
                            errorMessage += ': ' + status + ' - ' + error;
                        }
                    } else if (error) {
                        errorMessage += ': ' + error;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });
        });
    }
};

// Example usage:
$(document).ready(function() {
    // Add click handler for a scan button (if it exists)
    $('#scan-button').on('click', function() {
        // Show loading indicator
        $('#scan-status').text('Loading scan destinations...');
        
        // Get scan destinations
        EpsonClient.getScanDestinations()
            .then(function(response) {
                // Display scan destinations
                const destinations = response.destinations || [];
                
                if (destinations.length === 0) {
                    $('#scan-status').text('No scan destinations found.');
                    return;
                }
                
                // Clear previous destinations
                $('#scan-destinations').empty();
                
                // Add destinations to select dropdown
                destinations.forEach(function(dest) {
                    $('#scan-destinations').append(
                        $('<option></option>').val(dest.id).text(dest.name)
                    );
                });
                
                // Show scan form
                $('#scan-form').show();
                $('#scan-status').text('Ready to scan.');
            })
            .catch(function(error) {
                // Show error message
                $('#scan-status').text(`Error: ${error.message}`);
                console.error(error);
            });
    });
    
    // Add submit handler for scan form (if it exists)
    $('#scan-form').on('submit', function(e) {
        e.preventDefault();
        
        // Get selected destination
        const destinationId = $('#scan-destinations').val();
        
        // Get scan settings
        const scanSettings = {
            destination_id: destinationId,
            resolution: $('#scan-resolution').val() || '300',
            color_mode: $('#scan-color-mode').val() || 'color',
            file_format: $('#scan-file-format').val() || 'pdf'
        };
        
        // Show loading indicator
        $('#scan-status').text('Starting scan job...');
        
        // Start scan job
        EpsonClient.startScanJob(scanSettings)
            .then(function(response) {
                // Show job ID
                $('#scan-status').text(`Scan job started. Job ID: ${response.job_id}`);
                
                // Store job ID for polling
                $('#scan-job-id').val(response.job_id);
                
                // Start polling for job status
                pollJobStatus(response.job_id);
            })
            .catch(function(error) {
                // Show error message
                $('#scan-status').text(`Error: ${error.message}`);
                console.error(error);
            });
    });
    
    // Function to poll job status
    function pollJobStatus(jobId) {
        // Show polling status
        $('#scan-status').text(`Checking scan job status (${jobId})...`);
        
        // Get job status
        EpsonClient.getScanJobStatus(jobId)
            .then(function(response) {
                // Update status
                $('#scan-status').text(`Scan job status: ${response.status}`);
                
                // If job is completed, show results
                if (response.status === 'completed') {
                    // Show success message
                    $('#scan-status').text('Scan job completed successfully!');
                    
                    // Show images if available
                    if (response.images && response.images.length > 0) {
                        $('#scan-results').empty();
                        
                        response.images.forEach(function(image) {
                            $('#scan-results').append(
                                $('<div></div>').addClass('scan-result-item').text(
                                    `Image ID: ${image.id}, Format: ${image.format}, Size: ${formatFileSize(image.size)}`
                                )
                            );
                        });
                        
                        $('#scan-results-container').show();
                    }
                } else if (response.status === 'pending' || response.status === 'processing') {
                    // Continue polling after a delay
                    setTimeout(function() {
                        pollJobStatus(jobId);
                    }, 2000); // Poll every 2 seconds
                } else {
                    // Show error for failed jobs
                    $('#scan-status').text(`Scan job failed with status: ${response.status}`);
                }
            })
            .catch(function(error) {
                // Show error message
                $('#scan-status').text(`Error checking job status: ${error.message}`);
                console.error(error);
            });
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
});
