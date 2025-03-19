/**
 * Bulk Print Component
 * Displays a list of receipts that can be selected and printed in bulk
 */
import { createElement } from '../utils/uiUtils.js';
import { printBatchReceipts } from '../services/epsonPrinterService.js';

export default class BulkPrintComponent {
  /**
   * Initialize the Bulk Print Component
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {Array} options.receipts - Array of receipt data objects
   * @param {Object} options.printerConnection - Printer connection object
   */
  constructor(options) {
    this.options = options;
    this.container = document.getElementById(options.containerId);
    this.receipts = options.receipts || [];
    this.printerConnection = options.printerConnection || null;
    
    // State
    this.selectedReceipts = [];
    this.isPrinting = false;
    this.printResults = null;
    this.expandedReceipt = null;
    this.selectAll = false;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handlePrintSelected = this.handlePrintSelected.bind(this);
    this.toggleReceiptSelection = this.toggleReceiptSelection.bind(this);
    this.toggleExpandReceipt = this.toggleExpandReceipt.bind(this);
    this.toggleSelectAll = this.toggleSelectAll.bind(this);
    this.formatCurrency = this.formatCurrency.bind(this);
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Bulk Print Component container not found');
      return;
    }
    
    // Initial render
    this.render();
  }
  
  /**
   * Format currency values for display
   * @param {string|number} value - Value to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(value) {
    if (!value) return '$0.00';
    
    // Remove any existing $ sign and convert to number
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  }
  
  /**
   * Toggle receipt selection
   * @param {number} index - Index of the receipt to toggle
   */
  toggleReceiptSelection(index) {
    if (this.selectedReceipts.includes(index)) {
      this.selectedReceipts = this.selectedReceipts.filter(i => i !== index);
    } else {
      this.selectedReceipts.push(index);
    }
    
    // Update selectAll state
    this.selectAll = this.selectedReceipts.length === this.receipts.length;
    
    this.render();
  }
  
  /**
   * Toggle select all receipts
   */
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    
    if (this.selectAll) {
      this.selectedReceipts = this.receipts.map((_, index) => index);
    } else {
      this.selectedReceipts = [];
    }
    
    this.render();
  }
  
  /**
   * Toggle receipt expanded view
   * @param {number} index - Index of the receipt to toggle
   */
  toggleExpandReceipt(index) {
    if (this.expandedReceipt === index) {
      this.expandedReceipt = null;
    } else {
      this.expandedReceipt = index;
    }
    
    this.render();
  }
  
  /**
   * Handle bulk printing of selected receipts
   */
  async handlePrintSelected() {
    if (this.selectedReceipts.length === 0 || !this.printerConnection) return;
    
    this.isPrinting = true;
    this.printResults = null;
    this.render();
    
    try {
      // Get only the selected receipts
      const receiptsToPrint = this.selectedReceipts.map(index => this.receipts[index]);
      
      // Print the receipts
      const results = await printBatchReceipts(this.printerConnection, receiptsToPrint);
      
      this.printResults = {
        success: results.success,
        totalPrinted: results.successfulPrints,
        totalFailed: results.failedPrints,
        details: results.results
      };
    } catch (error) {
      console.error('Error printing batch receipts:', error);
      this.printResults = {
        success: false,
        message: error.message,
        details: []
      };
    } finally {
      this.isPrinting = false;
      this.render();
    }
  }
  
  /**
   * Render the component
   */
  render() {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create component wrapper
    const wrapper = createElement('div', { className: 'bg-white p-6 rounded-lg shadow-md' });
    
    // Create header
    const header = createElement('div', { className: 'flex justify-between items-center mb-4' });
    
    // Create title
    const title = createElement('h3', { className: 'text-lg font-semibold text-gray-800' }, 'Bulk Print Receipts');
    
    // Create printer status indicator
    const statusContainer = createElement('div', { className: 'flex items-center gap-2' });
    
    // Check if printer is connected
    const isPrinterConnected = this.printerConnection && this.printerConnection.id;
    
    // Status indicator
    const statusIndicator = createElement('span', { 
      className: `inline-block w-3 h-3 rounded-full ${
        isPrinterConnected ? 'bg-green-500' : 'bg-red-500'
      }`
    });
    
    // Status text
    const statusText = createElement('span', { 
      className: 'text-sm text-gray-600' 
    }, isPrinterConnected ? 'Printer Connected' : 'Printer Not Connected');
    
    statusContainer.appendChild(statusIndicator);
    statusContainer.appendChild(statusText);
    
    header.appendChild(title);
    header.appendChild(statusContainer);
    
    wrapper.appendChild(header);
    
    // Create receipts list
    if (this.receipts.length > 0) {
      // Create select all checkbox
      const selectAllContainer = createElement('div', { 
        className: 'flex items-center mb-3 p-2 bg-gray-50 rounded-md'
      });
      
      const selectAllCheckbox = createElement('input', {
        type: 'checkbox',
        id: 'select-all-receipts',
        checked: this.selectAll,
        className: 'mr-2',
        onChange: this.toggleSelectAll
      });
      
      const selectAllLabel = createElement('label', {
        htmlFor: 'select-all-receipts',
        className: 'text-sm font-medium'
      }, 'Select All Receipts');
      
      selectAllContainer.appendChild(selectAllCheckbox);
      selectAllContainer.appendChild(selectAllLabel);
      
      // Add print button
      const printButtonContainer = createElement('div', { className: 'ml-auto' });
      
      const printButton = createElement('button', {
        className: `flex items-center gap-2 py-1 px-3 rounded-md ${
          this.selectedReceipts.length === 0 || !isPrinterConnected || this.isPrinting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`,
        disabled: this.selectedReceipts.length === 0 || !isPrinterConnected || this.isPrinting,
        onClick: this.selectedReceipts.length === 0 || !isPrinterConnected || this.isPrinting 
          ? null 
          : this.handlePrintSelected
      });
      
      // Printer icon
      const printerIcon = createElement('div', {
        className: 'w-4 h-4',
        innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`
      });
      
      // Refresh icon for printing state
      const refreshIcon = createElement('div', {
        className: 'w-4 h-4 animate-spin',
        innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`
      });
      
      if (this.isPrinting) {
        printButton.appendChild(refreshIcon);
        printButton.appendChild(document.createTextNode('Printing...'));
      } else {
        printButton.appendChild(printerIcon);
        printButton.appendChild(document.createTextNode(`Print Selected (${this.selectedReceipts.length})`));
      }
      
      printButtonContainer.appendChild(printButton);
      selectAllContainer.appendChild(printButtonContainer);
      
      wrapper.appendChild(selectAllContainer);
      
      // Create receipts list
      const receiptsList = createElement('div', { className: 'space-y-2 max-h-80 overflow-y-auto' });
      
      this.receipts.forEach((receipt, index) => {
        const isSelected = this.selectedReceipts.includes(index);
        const isExpanded = this.expandedReceipt === index;
        
        // Receipt item container
        const receiptItem = createElement('div', { 
          className: `border rounded-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`
        });
        
        // Receipt header
        const receiptHeader = createElement('div', { 
          className: 'flex items-center p-3 cursor-pointer',
          onClick: () => this.toggleReceiptSelection(index)
        });
        
        // Checkbox
        const checkbox = createElement('input', {
          type: 'checkbox',
          checked: isSelected,
          className: 'mr-3',
          onChange: () => this.toggleReceiptSelection(index)
        });
        
        // Receipt info
        const receiptInfo = createElement('div', { className: 'flex-1' });
        
        // Receipt title
        const receiptTitle = createElement('div', { className: 'font-medium' }, 
          `Receipt #${receipt.check_number || index + 1}`
        );
        
        // Receipt details
        const receiptDetails = createElement('div', { className: 'text-sm text-gray-600' }, 
          `${receipt.customer_name || 'Unknown'} - ${receipt.date || 'No date'} - ${this.formatCurrency(receipt.total)}`
        );
        
        receiptInfo.appendChild(receiptTitle);
        receiptInfo.appendChild(receiptDetails);
        
        // Expand button
        const expandButton = createElement('button', {
          className: 'ml-2 text-gray-500 hover:text-gray-700',
          onClick: (e) => {
            e.stopPropagation();
            this.toggleExpandReceipt(index);
          }
        });
        
        // Expand icon
        const expandIcon = createElement('div', {
          className: 'w-5 h-5',
          innerHTML: isExpanded 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`
        });
        
        expandButton.appendChild(expandIcon);
        
        receiptHeader.appendChild(checkbox);
        receiptHeader.appendChild(receiptInfo);
        receiptHeader.appendChild(expandButton);
        
        receiptItem.appendChild(receiptHeader);
        
        // Expanded receipt details
        if (isExpanded) {
          const expandedDetails = createElement('div', { 
            className: 'p-3 pt-0 border-t border-gray-200 bg-gray-50'
          });
          
          // Create receipt details table
          const detailsTable = createElement('table', { className: 'w-full text-sm' });
          
          // Create table body
          const tableBody = createElement('tbody');
          
          // Add receipt details rows
          const detailsRows = [
            { label: 'Customer', value: receipt.customer_name || 'N/A' },
            { label: 'Check #', value: receipt.check_number || 'N/A' },
            { label: 'Date', value: receipt.date || 'N/A' },
            { label: 'Time', value: receipt.time || 'N/A' },
            { label: 'Payment', value: receipt.payment_type || 'N/A' },
            { label: 'Subtotal', value: this.formatCurrency(receipt.amount) },
            { label: 'Tip', value: this.formatCurrency(receipt.tip) },
            { label: 'Total', value: this.formatCurrency(receipt.total) },
            { label: 'Signed', value: receipt.signed ? 'Yes' : 'No' }
          ];
          
          detailsRows.forEach(row => {
            const tr = createElement('tr', { className: 'border-b border-gray-200 last:border-0' });
            
            const tdLabel = createElement('td', { className: 'py-1 font-medium' }, row.label);
            const tdValue = createElement('td', { className: 'py-1 text-right' }, row.value);
            
            tr.appendChild(tdLabel);
            tr.appendChild(tdValue);
            
            tableBody.appendChild(tr);
          });
          
          detailsTable.appendChild(tableBody);
          expandedDetails.appendChild(detailsTable);
          
          receiptItem.appendChild(expandedDetails);
        }
        
        receiptsList.appendChild(receiptItem);
      });
      
      wrapper.appendChild(receiptsList);
      
      // Print results
      if (this.printResults) {
        const resultsContainer = createElement('div', {
          className: `mt-4 p-3 rounded-md ${
            this.printResults.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`
        });
        
        // Results header
        const resultsHeader = createElement('div', { 
          className: 'flex items-center gap-2 mb-2'
        });
        
        // Results icon
        const resultsIcon = createElement('div', {
          className: 'w-5 h-5',
          innerHTML: this.printResults.success 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        });
        
        // Results title
        const resultsTitle = createElement('span', { 
          className: 'font-medium'
        }, this.printResults.success 
          ? 'Print job completed' 
          : 'Print job failed'
        );
        
        resultsHeader.appendChild(resultsIcon);
        resultsHeader.appendChild(resultsTitle);
        
        resultsContainer.appendChild(resultsHeader);
        
        // Results summary
        if (this.printResults.success) {
          const resultsSummary = createElement('div', { className: 'text-sm' });
          
          resultsSummary.appendChild(document.createTextNode(
            `Successfully printed ${this.printResults.totalPrinted} of ${this.printResults.totalPrinted + this.printResults.totalFailed} receipts.`
          ));
          
          if (this.printResults.totalFailed > 0) {
            resultsSummary.appendChild(document.createElement('br'));
            resultsSummary.appendChild(document.createTextNode(
              `Failed to print ${this.printResults.totalFailed} receipts.`
            ));
          }
          
          resultsContainer.appendChild(resultsSummary);
        } else {
          const errorMessage = createElement('div', { className: 'text-sm text-red-600' }, 
            this.printResults.message || 'Unknown error occurred during printing.'
          );
          
          resultsContainer.appendChild(errorMessage);
        }
        
        wrapper.appendChild(resultsContainer);
      }
    } else {
      // No receipts message
      const noReceiptsMessage = createElement('div', { 
        className: 'p-6 text-center text-gray-500 border border-gray-200 rounded-md'
      }, 'No receipts available for printing.');
      
      wrapper.appendChild(noReceiptsMessage);
    }
    
    // Warning message if printer not connected
    if (!isPrinterConnected) {
      const warningContainer = createElement('div', {
        className: 'mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm'
      }, 'Connect to a printer first to enable printing');
      
      wrapper.appendChild(warningContainer);
    }
    
    // Add wrapper to container
    this.container.appendChild(wrapper);
    
    // Add animation styles if they don't exist
    this.addAnimationStyles();
  }
  
  /**
   * Add animation styles to the document
   */
  addAnimationStyles() {
    // Check if styles already exist
    if (document.getElementById('bulk-print-component-styles')) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'bulk-print-component-styles';
    
    // Add CSS
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    
    // Add style to document head
    document.head.appendChild(style);
  }
  
  /**
   * Update receipts data
   * @param {Array} receipts - New receipts data
   */
  updateReceipts(receipts) {
    this.receipts = receipts || [];
    this.selectedReceipts = [];
    this.selectAll = false;
    this.expandedReceipt = null;
    this.render();
  }
  
  /**
   * Update printer connection
   * @param {Object} printerConnection - New printer connection
   */
  updatePrinterConnection(printerConnection) {
    this.printerConnection = printerConnection;
    this.render();
  }
}
