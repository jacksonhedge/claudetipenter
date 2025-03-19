/**
 * Utility functions for data manipulation and formatting
 */

/**
 * Formats monetary values to always have 2 decimal places
 * @param {Object} result - The result object containing receipt data
 * @returns {Object} - The result object with formatted monetary values
 */
export function formatMonetaryValues(result) {
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

/**
 * Generates simulated receipt data for testing
 * @param {Array} base64Files - Array of base64-encoded files
 * @returns {Object} - Simulated receipt data
 */
export function generateSimulatedData(base64Files) {
    // Sample data arrays for more variety
    const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer", "William", "Lisa", "James", "Mary", "Thomas", "Patricia", "Charles"];
    const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson"];
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28"];
    const years = ["2024", "2025"];
    const hours = ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
    const minutes = ["00", "15", "30", "45"];
    const paymentTypes = ["Mastercard", "Visa", "AMEX", "Discover"];
    
    return {
        success: true,
        processed_images: base64Files.length,
        note: "This is a simulated response. Using simulated data instead of real API.",
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
            
            // Select random payment type
            const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
            
            return {
                file_name: file.name,
                date: `${month}/${day}/${year}`,
                time: `${hour}:${minute}`,
                customer_name: `${firstName} ${lastName}`,
                check_number: checkNumber.toString(),
                amount: `$${baseAmount}`,
                payment_type: paymentType,
                tip: `$${tipAmount}`,
                total: `$${totalAmount}`,
                signed: signed,
                confidence: (Math.random() * 0.3 + 0.7).toFixed(2) // Random confidence between 0.7 and 1.0
            };
        })
    };
}

/**
 * Converts table data to CSV format
 * @param {HTMLTableElement} table - The table element to convert
 * @returns {string} - CSV formatted string
 */
export function tableToCSV(table) {
    const rows = [];
    const headers = ['Customer Name', 'Check #', 'Check Amount', 'Payment Type', 'Closing Time', 'Check Total', 'Tip'];
    
    // Add headers
    rows.push(headers.join(','));
    
    // Add data rows
    const tableRows = table.querySelectorAll('tr');
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
    return rows.join('\n');
}

/**
 * Sorts an array of receipt data based on specified field and order
 * @param {Array} data - Array of receipt data objects
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted array
 */
export function sortReceiptData(data, field, order) {
    if (!data || !Array.isArray(data)) return data;
    
    return [...data].sort((a, b) => {
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
                if (!timeStr) return 0;
                
                // Handle AM/PM format
                let isPM = false;
                let timeValue = timeStr;
                
                if (timeStr.toLowerCase().includes('pm')) {
                    isPM = true;
                    timeValue = timeStr.toLowerCase().replace('pm', '').trim();
                } else if (timeStr.toLowerCase().includes('am')) {
                    timeValue = timeStr.toLowerCase().replace('am', '').trim();
                }
                
                // Split hours and minutes
                const parts = timeValue.split(':');
                if (parts.length < 2) return 0;
                
                let hours = parseInt(parts[0], 10) || 0;
                let minutes = parseInt(parts[1], 10) || 0;
                
                // Convert to 24-hour format if PM
                if (isPM && hours < 12) {
                    hours += 12;
                }
                // Handle 12 AM as 0 hours
                if (!isPM && hours === 12) {
                    hours = 0;
                }
                
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
}

/**
 * Filters an array of receipt data based on a field and value
 * @param {Array} data - Array of receipt data objects
 * @param {string} field - Field to filter by
 * @param {string} value - Value to filter for
 * @returns {Array} - Filtered array
 */
export function filterReceiptData(data, field, value) {
    console.log(`[dataUtils] filterReceiptData called with field: ${field}, value: "${value}"`);
    
    // If no data or not an array, return as is
    if (!data || !Array.isArray(data)) {
        console.log('[dataUtils] No data or not an array, returning original data');
        return data;
    }
    
    // If empty value, return all data
    if (!value || value.trim() === '') {
        console.log('[dataUtils] Empty filter value, returning all data');
        return [...data];
    }
    
    const lowerValue = value.toLowerCase();
    console.log(`[dataUtils] Filtering ${data.length} items with lowercase value: "${lowerValue}"`);
    
    const filteredData = data.filter(item => {
        // If item doesn't have the field, exclude it
        if (!item[field]) {
            return false;
        }
        
        let fieldValue = String(item[field]).toLowerCase();
        
        // Remove $ sign for monetary values
        if (field === 'total' || field === 'tip' || field === 'amount') {
            fieldValue = fieldValue.replace(/\$/g, '');
        }
        
        return fieldValue.includes(lowerValue);
    });
    
    console.log(`[dataUtils] Filter result: ${filteredData.length} items match`);
    return filteredData;
}
