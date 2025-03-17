/**
 * Results Table Component
 * Displays receipt data in a sortable table format
 */
import { sortReceiptData } from '../utils/dataUtils.js';
import { exportTableToCsv } from '../services/exportService.js';
import { createElement } from '../utils/uiUtils.js';
import config from '../config.js';

export default class ResultsTable {
    /**
     * Initialize the results table component
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
        this.currentData = null;
        
        // Ensure required elements exist
        if (!this.tableBody) {
            console.error('Required elements not found for ResultsTable');
            return;
        }
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Set default sort options
        if (this.sortField) {
            this.sortField.value = config.ui.defaultSortField;
        }
        
        if (this.sortOrder) {
            this.sortOrder.value = config.ui.defaultSortOrder;
        }
        
        // Event Listeners
        if (this.sortBtn) {
            this.sortBtn.addEventListener('click', this.handleSort.bind(this));
        }
        
        if (this.exportCsvBtn) {
            this.exportCsvBtn.addEventListener('click', this.handleExportCsv.bind(this));
        }
    }
    
    /**
     * Populate the table with data
     * @param {Object} data - The data to display
     */
    populateTable(data) {
        // Store the current data
        this.currentData = data;
        
        // Clear existing table rows
        this.tableBody.innerHTML = '';
        
        if (data && data.results && Array.isArray(data.results)) {
            data.results.forEach(item => {
                const row = document.createElement('tr');
                
                // Create cells for each column
                const customerNameCell = document.createElement('td');
                customerNameCell.textContent = item.customer_name || 'N/A';
                
                const checkNumberCell = document.createElement('td');
                checkNumberCell.textContent = item.check_number || 'N/A';
                
                const amountCell = document.createElement('td');
                amountCell.textContent = item.amount || 'N/A';
                
                const paymentTypeCell = document.createElement('td');
                paymentTypeCell.textContent = item.payment_type || 'N/A';
                
                const timeCell = document.createElement('td');
                timeCell.textContent = item.time || 'N/A';
                
                const totalCell = document.createElement('td');
                totalCell.textContent = item.total || 'N/A';
                
                const tipCell = document.createElement('td');
                tipCell.textContent = item.tip || 'N/A';
                
                // Add cells to row
                row.appendChild(customerNameCell);
                row.appendChild(checkNumberCell);
                row.appendChild(amountCell);
                row.appendChild(paymentTypeCell);
                row.appendChild(timeCell);
                row.appendChild(totalCell);
                row.appendChild(tipCell);
                
                // Add row to table
                this.tableBody.appendChild(row);
            });
        }
    }
    
    /**
     * Handle sort button click
     */
    handleSort() {
        if (!this.currentData || !this.currentData.results) return;
        
        const field = this.sortField.value;
        const order = this.sortOrder.value;
        
        // Sort the data
        const sortedResults = sortReceiptData(this.currentData.results, field, order);
        
        // Create a new data object with sorted results
        const sortedData = {
            ...this.currentData,
            results: sortedResults
        };
        
        // Repopulate the table with sorted data
        this.populateTable(sortedData);
        
        // Visual feedback that sorting was applied
        this.sortBtn.classList.add('active');
        this.sortBtn.textContent = 'Sorted!';
        setTimeout(() => {
            this.sortBtn.textContent = 'Sort';
            this.sortBtn.classList.remove('active');
        }, 1000);
    }
    
    /**
     * Handle export CSV button click
     */
    handleExportCsv() {
        // Get the table element (parent of tableBody)
        const table = this.tableBody.closest('table');
        if (!table) return;
        
        // Export the table to CSV
        exportTableToCsv(table);
    }
    
    /**
     * Get the current data
     * @returns {Object} - The current data
     */
    getData() {
        return this.currentData;
    }
    
    /**
     * Clear the table
     */
    clear() {
        this.tableBody.innerHTML = '';
        this.currentData = null;
    }
    
    /**
     * Add a row to the table
     * @param {Object} item - The item data to add
     */
    addRow(item) {
        const row = createElement('tr');
        
        // Create cells for each column
        const customerNameCell = createElement('td', {}, item.customer_name || 'N/A');
        const checkNumberCell = createElement('td', {}, item.check_number || 'N/A');
        const amountCell = createElement('td', {}, item.amount || 'N/A');
        const paymentTypeCell = createElement('td', {}, item.payment_type || 'N/A');
        const timeCell = createElement('td', {}, item.time || 'N/A');
        const totalCell = createElement('td', {}, item.total || 'N/A');
        const tipCell = createElement('td', {}, item.tip || 'N/A');
        
        // Add cells to row
        row.appendChild(customerNameCell);
        row.appendChild(checkNumberCell);
        row.appendChild(amountCell);
        row.appendChild(paymentTypeCell);
        row.appendChild(timeCell);
        row.appendChild(totalCell);
        row.appendChild(tipCell);
        
        // Add row to table
        this.tableBody.appendChild(row);
        
        // Update current data if it exists
        if (this.currentData && this.currentData.results) {
            this.currentData.results.push(item);
        } else {
            this.currentData = {
                results: [item]
            };
        }
        
        return row;
    }
}
