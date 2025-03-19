/**
 * Organizer Results Table Component
 * Handles displaying and sorting the file organizer results in a table
 */
import { exportToCSV, openInGoogleSheets, createFullScreenTableView } from '../services/fileService.js';

export default class OrganizerResultsTable {
    /**
     * Initialize the organizer results table component
     * @param {Object} options - Configuration options
     * @param {string} options.tableBodyId - ID of the table body element
     * @param {string} options.sortFieldId - ID of the sort field select element
     * @param {string} options.sortOrderId - ID of the sort order select element
     * @param {string} options.sortBtnId - ID of the sort button
     * @param {string} options.exportCsvBtnId - ID of the export CSV button
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.tableBody = document.getElementById(options.tableBodyId);
        this.sortField = document.getElementById(options.sortFieldId);
        this.sortOrder = document.getElementById(options.sortOrderId);
        this.sortBtn = document.getElementById(options.sortBtnId);
        this.exportCsvBtn = document.getElementById(options.exportCsvBtnId);
        
        // Data
        this.data = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Add event listeners
        if (this.sortBtn) {
            this.sortBtn.addEventListener('click', this.handleSort.bind(this));
        }
        
        if (this.exportCsvBtn) {
            this.exportCsvBtn.addEventListener('click', this.handleExportCsv.bind(this));
        }
        
        // Add Google Sheets and Full Screen Table buttons
        this.addExtraButtons();
    }
    
    /**
     * Add Google Sheets and Full Screen Table buttons
     */
    addExtraButtons() {
        // Find the table controls container
        const tableHeader = document.querySelector('.table-header');
        const tableControls = tableHeader ? tableHeader.querySelector('.table-controls') : null;
        
        if (!tableControls) return;
        
        // Create Google Sheets button
        const googleSheetsBtn = document.createElement('button');
        googleSheetsBtn.className = 'export-btn';
        googleSheetsBtn.innerHTML = '<i class="fas fa-table"></i> Open in Google Sheets';
        googleSheetsBtn.title = 'Open data in Google Sheets';
        googleSheetsBtn.addEventListener('click', this.handleOpenInGoogleSheets.bind(this));
        
        // Create Full Screen Table button
        const fullScreenTableBtn = document.createElement('button');
        fullScreenTableBtn.className = 'export-btn';
        fullScreenTableBtn.innerHTML = '<i class="fas fa-expand"></i> Full Screen Table';
        fullScreenTableBtn.title = 'View table in full screen';
        fullScreenTableBtn.addEventListener('click', this.handleFullScreenTable.bind(this));
        
        // Add buttons to controls
        tableControls.appendChild(googleSheetsBtn);
        tableControls.appendChild(fullScreenTableBtn);
    }
    
    /**
     * Populate the table with data
     * @param {Object} data - The data to populate the table with
     */
    populateTable(data) {
        // Store the data
        this.data = data;
        
        // Clear the table
        if (this.tableBody) {
            this.tableBody.innerHTML = '';
        }
        
        // If no data, return
        if (!data || !data.results || data.results.length === 0) {
            return;
        }
        
        // Sort the data
        this.sortData();
        
        // Add rows to the table
        data.results.forEach(item => {
            this.addRow(item);
        });
    }
    
    /**
     * Add a row to the table
     * @param {Object} item - The item to add as a row
     */
    addRow(item) {
        if (!this.tableBody) return;
        
        // Create row
        const row = document.createElement('tr');
        
        // Check if this is an error item
        if (item.error === true) {
            // Create an error row that spans all columns
            row.className = 'error-row';
            
            // Format the error message with batch information if available
            let errorMessage = item.message || 'Unknown error';
            if (item.batch) {
                errorMessage = `Batch ${item.batch}: ${errorMessage}`;
            }
            
            // Add confidence information if available
            if (item.confidence) {
                errorMessage += `<br><span class="error-details">Confidence: ${(item.confidence * 100).toFixed(2)}%</span>`;
            }
            
            // Add tip information if available
            if (item.tip) {
                errorMessage += `<br><span class="error-details">Tip: ${item.tip}</span>`;
            }
            
            row.innerHTML = `
                <td colspan="17" class="error-message">${errorMessage}</td>
            `;
        } else {
            // Add cells with the new format for normal data
            row.innerHTML = `
                <td>${item.check_number || 'N/A'}</td>
                <td>${item.customer_name || 'N/A'}</td>
                <td>${item.server || 'N/A'}</td>
                <td>${item.time || 'N/A'}</td>
                <td>${item.guests || '1'}</td>
                <td>${item.comps || '$0.00'}</td>
                <td>${item.voids || '$0.00'}</td>
                <td>${item.amount || '$0.00'}</td>
                <td>${item.auto_grat || '$0.00'}</td>
                <td>${item.tax || '$0.00'}</td>
                <td>${item.total || '$0.00'}</td>
                <td>${item.payment_type || 'N/A'}</td>
                <td>${item.tip || '$0.00'}</td>
                <td>${item.cash || '$0.00'}</td>
                <td>${item.credit || '$0.00'}</td>
                <td>${item.tenders || '$0.00'}</td>
                <td>${item.rev_ctr || 'Back Bar'}</td>
            `;
        }
        
        // Add row to table
        this.tableBody.appendChild(row);
    }
    
    /**
     * Handle sort button click
     */
    handleSort() {
        this.sortData();
        this.populateTable(this.data);
    }
    
    /**
     * Sort the data based on the selected field and order
     */
    sortData() {
        if (!this.data || !this.data.results || !this.sortField || !this.sortOrder) {
            return;
        }
        
        const field = this.sortField.value;
        const order = this.sortOrder.value;
        
        this.data.results.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Handle numeric values
            if (field === 'amount' || field === 'tip' || field === 'total') {
                valueA = parseFloat(valueA.replace(/[^\d.-]/g, '') || 0);
                valueB = parseFloat(valueB.replace(/[^\d.-]/g, '') || 0);
            } else if (field === 'time') {
                // Special handling for time values with AM/PM
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
                
                valueA = getMinutes(String(valueA));
                valueB = getMinutes(String(valueB));
            } else {
                // Convert to lowercase for string comparison
                valueA = String(valueA).toLowerCase();
                valueB = String(valueB).toLowerCase();
            }
            
            // Compare values
            if (valueA < valueB) {
                return order === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    
    /**
     * Handle export CSV button click
     */
    handleExportCsv() {
        if (!this.data || !this.data.results) {
            return;
        }
        
        // Convert data to CSV with the new format
        const headers = ['#', 'Name', 'Server', 'Time', 'Guests', 'Comps', 'Voids', 'Net Sales', 'Auto Grat', 'Tax', 'Bill Total', 'Payment', 'Tips', 'Cash', 'Credit', 'Tenders', 'Rev Ctr'];
        const rows = this.data.results.map(item => {
            // Skip error items or convert them to a special format
            if (item.error === true) {
                return ['ERROR', item.message || 'Unknown error', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            }
            
            return [
                item.check_number || '',
                item.customer_name || '',
                item.server || '',
                item.time || '',
                item.guests || '1',
                item.comps || '$0.00',
                item.voids || '$0.00',
                item.amount || '$0.00',
                item.auto_grat || '$0.00',
                item.tax || '$0.00',
                item.total || '$0.00',
                item.payment_type || '',
                item.tip || '$0.00',
                item.cash || '$0.00',
                item.credit || '$0.00',
                item.tenders || '$0.00',
                item.rev_ctr || 'Back Bar'
            ];
        });
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            // Escape commas in values
            const escapedRow = row.map(value => {
                // If value contains comma, quote, or newline, wrap in quotes
                if (/[,"\n]/.test(value)) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += escapedRow.join(',') + '\n';
        });
        
        // Export to CSV
        exportToCSV(csvContent, 'organized_files.csv');
    }
    
    /**
     * Handle Open in Google Sheets button click
     */
    handleOpenInGoogleSheets() {
        if (!this.data || !this.data.results) {
            return;
        }
        
        // Define headers and prepare data rows with the new format
        const headers = ['#', 'Name', 'Server', 'Time', 'Guests', 'Comps', 'Voids', 'Net Sales', 'Auto Grat', 'Tax', 'Bill Total', 'Payment', 'Tips', 'Cash', 'Credit', 'Tenders', 'Rev Ctr'];
        const rows = this.data.results.map(item => {
            // Skip error items or convert them to a special format
            if (item.error === true) {
                return ['ERROR', item.message || 'Unknown error', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            }
            
            return [
                item.check_number || '',
                item.customer_name || '',
                item.server || '',
                item.time || '',
                item.guests || '1',
                item.comps || '$0.00',
                item.voids || '$0.00',
                item.amount || '$0.00',
                item.auto_grat || '$0.00',
                item.tax || '$0.00',
                item.total || '$0.00',
                item.payment_type || '',
                item.tip || '$0.00',
                item.cash || '$0.00',
                item.credit || '$0.00',
                item.tenders || '$0.00',
                item.rev_ctr || 'Back Bar'
            ];
        });
        
        // Open data in Google Sheets
        openInGoogleSheets(headers, rows);
    }
    
    /**
     * Handle Full Screen Table button click
     */
    handleFullScreenTable() {
        if (!this.data || !this.data.results) {
            return;
        }
        
        // Define headers and prepare data rows with the new format
        const headers = ['#', 'Name', 'Server', 'Time', 'Guests', 'Comps', 'Voids', 'Net Sales', 'Auto Grat', 'Tax', 'Bill Total', 'Payment', 'Tips', 'Cash', 'Credit', 'Tenders', 'Rev Ctr'];
        const rows = this.data.results.map(item => {
            // Skip error items or convert them to a special format
            if (item.error === true) {
                return ['ERROR', item.message || 'Unknown error', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            }
            
            return [
                item.check_number || '',
                item.customer_name || '',
                item.server || '',
                item.time || '',
                item.guests || '1',
                item.comps || '$0.00',
                item.voids || '$0.00',
                item.amount || '$0.00',
                item.auto_grat || '$0.00',
                item.tax || '$0.00',
                item.total || '$0.00',
                item.payment_type || '',
                item.tip || '$0.00',
                item.cash || '$0.00',
                item.credit || '$0.00',
                item.tenders || '$0.00',
                item.rev_ctr || 'Back Bar'
            ];
        });
        
        // Create full screen table view
        createFullScreenTableView(headers, rows);
    }
}
