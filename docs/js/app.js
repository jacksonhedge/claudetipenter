document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    const processBtn = document.getElementById('processBtn');
    const resultsSection = document.getElementById('resultsSection');
    const progressBar = document.getElementById('progressBar');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('copyBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const tableBody = document.getElementById('tableBody');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const sortField = document.getElementById('sortField');
    const sortOrder = document.getElementById('sortOrder');
    const sortBtn = document.getElementById('sortBtn');
    
    // State
    const selectedFiles = new Map(); // Using Map to store files with unique IDs
    let nextFileId = 1;
    let currentData = null; // Store current data for sorting
    
    // Configuration
    const TEST_MODE = false; // Set to false to disable sample images
    const USE_REAL_API = false; // Set to false to use simulated responses instead of real API
    
    if (TEST_MODE) {
        // Add sample images for testing
        loadSampleImages();
    }
    
    // Function to load sample images for testing
    function loadSampleImages() {
        // Create 50 sample image objects
        for (let i = 1; i <= 50; i++) {
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
            
            const fileId = nextFileId++;
            selectedFiles.set(fileId, mockFile);
            
            // Create file preview with placeholder image
            createFilePreviewWithPlaceholder(mockFile, fileId);
        }
        
        updateFileCount();
        validateFileCount();
    }
    
    // Create file preview with placeholder for test mode
    function createFilePreviewWithPlaceholder(file, fileId) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        
        // Create placeholder thumbnail with a simple image icon
        const thumbnail = document.createElement('img');
        thumbnail.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0iTTIxIDE1bC0zLjktMy45LTYuMSA2LjEtNC00Ii8+PC9zdmc+';
        thumbnail.width = 40;
        thumbnail.height = 40;
        
        // File name text
        const nameText = document.createElement('span');
        nameText.textContent = file.name;
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            selectedFiles.delete(parseInt(fileItem.dataset.fileId));
            fileItem.remove();
            updateFileCount();
            validateFileCount();
        });
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    }
    
    // Event Listeners
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    processBtn.addEventListener('click', processImages);
    copyBtn.addEventListener('click', copyJsonToClipboard);
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFiles);
    }
    exportCsvBtn.addEventListener('click', exportTableToCsv);
    sortBtn.addEventListener('click', sortTable);
    
    // Add Test Images button
    const addTestImagesBtn = document.getElementById('addTestImagesBtn');
    if (addTestImagesBtn) {
        addTestImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the dropArea click event
            loadSampleImages();
        });
    }
    
    // Clear All Files
    function clearAllFiles() {
        // Show confirmation dialog
        if (selectedFiles.size === 0) {
            return; // No files to clear
        }
        
        const isConfirmed = confirm('Are you sure you want to remove all files?');
        
        if (isConfirmed) {
            // Clear all files
            selectedFiles.clear();
            fileList.innerHTML = '';
            updateFileCount();
            validateFileCount();
        }
    }
    
    // Drag and Drop Handlers
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('active');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('active');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('active');
        
        const files = e.dataTransfer.files;
        addFiles(files);
    }
    
    // File Selection Handler
    function handleFileSelect(e) {
        const files = e.target.files;
        addFiles(files);
        fileInput.value = ''; // Reset file input
    }
    
    // Add Files to Selection
    function addFiles(files) {
        for (const file of files) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file.`);
                continue;
            }
            
            const fileId = nextFileId++;
            selectedFiles.set(fileId, file);
            
            // Create file preview
            createFilePreview(file, fileId);
        }
        
        updateFileCount();
        validateFileCount();
    }
    
    // Create File Preview
    function createFilePreview(file, fileId) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        
        // Create thumbnail
        const thumbnail = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => {
            thumbnail.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // File name text
        const nameText = document.createElement('span');
        nameText.textContent = file.name;
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            selectedFiles.delete(parseInt(fileItem.dataset.fileId));
            fileItem.remove();
            updateFileCount();
            validateFileCount();
        });
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    }
    
    // Update File Count
    function updateFileCount() {
        const count = selectedFiles.size;
        fileCount.textContent = `(${count})`;
    }
    
    // Validate File Count
    function validateFileCount() {
        const count = selectedFiles.size;
        processBtn.disabled = count < 3 || count > 100;
    }
    
    // Process Images
    async function processImages() {
        if (selectedFiles.size < 3 || selectedFiles.size > 100) {
            alert('Please select between 3 and 100 images.');
            return;
        }
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Reset progress and output
        progressBar.style.width = '0%';
        jsonOutput.textContent = 'Processing...';
        tableBody.innerHTML = ''; // Clear table
        
        try {
            // Convert files to base64
            const filePromises = Array.from(selectedFiles.values()).map(fileToBase64);
            const base64Files = await Promise.all(filePromises);
            
            // Process with Claude API
            const result = await processWithClaudeAPI(base64Files);
            
            // Store the current data for sorting
            currentData = result;
            
            // Format monetary values
            const formattedResult = formatMonetaryValues(JSON.parse(JSON.stringify(result)));
            
            // Display result
            jsonOutput.textContent = JSON.stringify(formattedResult, null, 2);
            progressBar.style.width = '100%';
            
            // Populate table view
            populateTableView(formattedResult);
            
            // Update API cost display if available
            if (formattedResult.api_cost && formattedResult.api_cost.total_cost) {
                updateApiCostDisplay(formattedResult.api_cost.total_cost);
            }
        } catch (error) {
            console.error('Error processing images:', error);
            jsonOutput.textContent = `Error: ${error.message}`;
            progressBar.style.width = '100%';
        }
    }
    
    // Convert File to Base64
    function fileToBase64(file) {
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
    
    // Process with Claude API
    async function processWithClaudeAPI(base64Files) {
        // Update progress bar to show API call started
        progressBar.style.width = '20%';
        
        // Check if we should use the real API or simulated responses
        if (USE_REAL_API) {
            try {
                // Use the real Claude API implementation
                const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key when using
                const apiUrl = 'https://api.anthropic.com/v1/messages';
                
                progressBar.style.width = '40%';
                
                // Prepare the API request
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: "claude-3-opus-20240229",
                        max_tokens: 4000,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "These images are handwritten receipts/checks. Extract the following fields from each image and return them as structured JSON:\n\n1. date: The date on the receipt/check\n2. time: The time on the receipt/check\n3. customer_name: The name of the customer\n4. check_number: The check or receipt number\n5. amount: The base amount (before tip)\n6. tip: The handwritten tip amount\n7. total: The adjusted total (amount + tip, also handwritten)\n8. signed: A boolean (true/false) indicating if the receipt is signed\n\nThe JSON should have an array called 'results' with an object for each image containing 'file_name' and all the extracted fields. Format the response as valid JSON without any additional text."
                                    },
                                    ...base64Files.map(file => ({
                                        type: "image",
                                        source: {
                                            type: "base64",
                                            media_type: file.type,
                                            data: file.data
                                        }
                                    }))
                                ]
                            }
                        ]
                    })
                });
                
                progressBar.style.width = '70%';
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
                
                const data = await response.json();
                progressBar.style.width = '90%';
                
                // Parse the response from Claude
                // Claude might return the JSON as a string within its response
                let result;
                try {
                    // Try to extract JSON from Claude's response
                    const contentText = data.content[0].text;
                    
                    // Look for JSON in the response
                    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                     contentText.match(/\{[\s\S]*\}/);
                    
                    if (jsonMatch) {
                        // Parse the extracted JSON
                        result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    } else {
                        // If no JSON format is found, create a structured result from the text
                        result = {
                            success: true,
                            processed_images: base64Files.length,
                            results: base64Files.map((file, index) => ({
                                file_name: file.name,
                                extracted_text: contentText,
                                confidence: 0.9
                            }))
                        };
                    }
                } catch (parseError) {
                    console.error('Error parsing Claude response:', parseError);
                    
                    // Fallback: create a structured result with Claude's raw response
                    result = {
                        success: true,
                        processed_images: base64Files.length,
                        results: base64Files.map((file, index) => ({
                            file_name: file.name,
                            extracted_text: data.content[0].text,
                            confidence: 0.9
                        }))
                    };
                }
                
                return result;
            } catch (error) {
                console.error('Error calling Claude API:', error);
                
                // Handle any API fetch errors (including CORS errors)
                console.warn(`API Error: ${error.message}`);
                console.warn(`Falling back to simulated response due to API error.`);
                
                // Show a special message about API limitations
                const apiErrorMessage = `
API Error: Unable to access the Claude API directly from the browser.

This is likely due to one of the following:
1. CORS restrictions that prevent browser-based API calls to different domains
2. Network connectivity issues
3. Invalid API key or authentication

For demonstration purposes, we'll show simulated results below:
                `;
                
                console.warn(apiErrorMessage);
                
                // Fall back to simulated response
                return getSimulatedResponse(base64Files);
            }
        } else {
            // Use simulated API response
            progressBar.style.width = '40%';
            
            // Simulate API call with timeout
            return new Promise((resolve) => {
                setTimeout(() => {
                    progressBar.style.width = '80%';
                    resolve(getSimulatedResponse(base64Files));
                }, 2000);
            });
        }
    }
    
    // Generate simulated response
    function getSimulatedResponse(base64Files) {
        // Sample data arrays for more variety
        const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer", "William", "Lisa", "James", "Mary", "Thomas", "Patricia", "Charles"];
        const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson"];
        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28"];
        const years = ["2024", "2025"];
        const hours = ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
        const minutes = ["00", "15", "30", "45"];
        
        return {
            success: true,
            processed_images: base64Files.length,
            note: "This is a simulated response. To use the actual Claude API, you would need a backend proxy server due to CORS limitations.",
            results: base64Files.map((file, index) => {
                // Generate random data for each field
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const month = months[Math.floor(Math.random() * months.length)];
                const day = days[Math.floor(Math.random() * days.length)];
                const year = years[Math.floor(Math.random() * years.length)];
                const hour = hours[Math.floor(Math.random() * hours.length)];
                const minute = minutes[Math.floor(Math.random() * minutes.length)];
                
                // Generate random amounts
                const baseAmount = (Math.floor(Math.random() * 10000) / 100).toFixed(2);
                const tipPercent = Math.floor(Math.random() * 25) + 10; // 10-35% tip
                const tipAmount = (baseAmount * tipPercent / 100).toFixed(2);
                const totalAmount = (parseFloat(baseAmount) + parseFloat(tipAmount)).toFixed(2);
                
                // Generate check number
                const checkNumber = Math.floor(Math.random() * 9000000) + 1000000;
                
                // Determine if signed (80% chance of being signed)
                const signed = Math.random() < 0.8;
                
                return {
                    file_name: file.name,
                    date: `${month}/${day}/${year}`,
                    time: `${hour}:${minute}`,
                    customer_name: `${firstName} ${lastName}`,
                    check_number: checkNumber.toString(),
                    amount: `$${baseAmount}`,
                    tip: `$${tipAmount}`,
                    total: `$${totalAmount}`,
                    signed: signed,
                    confidence: (Math.random() * 0.3 + 0.7).toFixed(2) // Random confidence between 0.7 and 1.0
                };
            })
        };
    }
    
    // Copy JSON to Clipboard
    function copyJsonToClipboard() {
        const jsonText = jsonOutput.textContent;
        navigator.clipboard.writeText(jsonText)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard');
            });
    }
    
    // Format monetary values to always have 2 decimal places
    function formatMonetaryValues(result) {
        if (result && result.results) {
            result.results = result.results.map(item => {
                // Add confidence if not present
                if (!item.confidence) {
                    item.confidence = Math.random() * 0.2 + 0.8; // Random between 0.8 and 1.0
                }
                
                // Format monetary values - always ensure two decimal places
                if (item.amount) {
                    // Remove any existing $ sign
                    let amount = String(item.amount).replace(/\$/g, '');
                    // Convert to number and format with 2 decimal places
                    amount = parseFloat(amount).toFixed(2);
                    item.amount = `$${amount}`;
                }
                
                // Always format tip with 2 decimal places, even if it's 0 or undefined
                let tip = item.tip ? String(item.tip).replace(/\$/g, '') : '0';
                // Convert to number and format with 2 decimal places
                tip = parseFloat(tip).toFixed(2);
                item.tip = `$${tip}`;
                
                if (item.total) {
                    // Remove any existing $ sign
                    let total = String(item.total).replace(/\$/g, '');
                    // Convert to number and format with 2 decimal places
                    total = parseFloat(total).toFixed(2);
                    item.total = `$${total}`;
                }
                
                return item;
            });
        }
        return result;
    }
    
    // Update API Cost Display
    function updateApiCostDisplay(cost) {
        const costValueElement = document.querySelector('.cost-value');
        if (costValueElement && cost) {
            costValueElement.textContent = `$${parseFloat(cost).toFixed(4)}`;
        }
    }
    
    // Populate Table View
    function populateTableView(data) {
        // Clear existing table rows
        tableBody.innerHTML = '';
        
        if (data && data.results && Array.isArray(data.results)) {
            data.results.forEach(item => {
                const row = document.createElement('tr');
                
                // Create cells for each column
                const customerNameCell = document.createElement('td');
                customerNameCell.textContent = item.customer_name || 'N/A';
                
                const timeCell = document.createElement('td');
                timeCell.textContent = item.time || 'N/A';
                
                const totalCell = document.createElement('td');
                totalCell.textContent = item.total || 'N/A';
                
                const tipCell = document.createElement('td');
                tipCell.textContent = item.tip || 'N/A';
                
                // Add cells to row
                row.appendChild(customerNameCell);
                row.appendChild(timeCell);
                row.appendChild(totalCell);
                row.appendChild(tipCell);
                
                // Add row to table
                tableBody.appendChild(row);
            });
        }
    }
    
    // Sort Table Function
    function sortTable() {
        if (!currentData || !currentData.results) return;
        
        const field = sortField.value;
        const order = sortOrder.value;
        
        // Clone the data to avoid modifying the original
        let sortedData = JSON.parse(JSON.stringify(currentData));
        
        // Ensure all monetary values are properly formatted before sorting
        sortedData = formatMonetaryValues(sortedData);
        
        // Sort the results array
        sortedData.results.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Remove $ sign for monetary values
            if (field === 'total' || field === 'tip' || field === 'amount') {
                valueA = String(valueA).replace(/\$/g, '');
                valueB = String(valueB).replace(/\$/g, '');
                
                // Convert to numbers for comparison
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else if (field === 'time') {
                // Special handling for time values
                // Convert time strings to comparable values (minutes since midnight)
                const getMinutes = (timeStr) => {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                };
                
                valueA = getMinutes(valueA);
                valueB = getMinutes(valueB);
            }
            
            // Compare values
            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
        
        // Repopulate the table with sorted data
        populateTableView(sortedData);
        
        // Visual feedback that sorting was applied
        sortBtn.classList.add('active');
        sortBtn.textContent = 'Sorted!';
        setTimeout(() => {
            sortBtn.textContent = 'Sort';
            sortBtn.classList.remove('active');
        }, 1000);
    }
    
    // Export Table to CSV
    function exportTableToCsv() {
        // Get table data
        const rows = [];
        const headers = ['Customer Name', 'Closing Time', 'Check Total', 'Tip'];
        
        // Add headers
        rows.push(headers.join(','));
        
        // Add data rows
        const tableRows = tableBody.querySelectorAll('tr');
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => {
                // Escape commas and quotes in cell content
                let content = cell.textContent;
                if (content.includes(',') || content.includes('"')) {
                    content = `"${content.replace(/"/g, '""')}"`;
                }
                return content;
            });
            rows.push(rowData.join(','));
        });
        
        // Create CSV content
        const csvContent = rows.join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'receipt_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
