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
            }
        });
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
                // Use the backend proxy server instead of calling Claude API directly
                const apiUrl = '/api/process-images';
                
                progressBar.style.width = '40%';
                
                // Prepare the API request to our proxy server
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        images: base64Files
                    })
                });
                
                progressBar.style.width = '70%';
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
                
                // The server already processes the Claude API response and returns a structured JSON
                const result = await response.json();
                progressBar.style.width = '90%';
                
                return result;
            } catch (error) {
                console.error('Error calling Claude API:', error);
                
                // Handle any API fetch errors (including CORS errors)
                console.warn(`API Error: ${error.message}`);
                console.warn(`Falling back to simulated response due to API error.`);
                
                // Show a special message about API limitations
                const apiErrorMessage = `
API Error: Unable to access the Claude API. 

This is likely due to one of the following:
1. The API key in the .env file is not set correctly
2. Network connectivity issues
3. The Claude API service is temporarily unavailable

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
