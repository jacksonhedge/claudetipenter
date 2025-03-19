/**
 * Receipt Template Component
 * Displays a receipt preview and provides printing functionality
 */
import { createElement } from '../utils/uiUtils.js';
import { printReceipt } from '../services/epsonPrinterService.js';

export default class ReceiptTemplate {
  /**
   * Initialize the Receipt Template component
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {Object} options.receiptData - Receipt data to display
   * @param {Object} options.printerConnection - Printer connection object
   */
  constructor(options) {
    this.options = options;
    this.container = document.getElementById(options.containerId);
    this.receiptData = options.receiptData || null;
    this.printerConnection = options.printerConnection || null;
    
    // State
    this.isPrinting = false;
    this.printResult = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handlePrint = this.handlePrint.bind(this);
    this.formatCurrency = this.formatCurrency.bind(this);
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Receipt Template container not found');
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
   * Handle print button click
   */
  async handlePrint() {
    if (!this.receiptData) return;
    
    this.isPrinting = true;
    this.printResult = null;
    this.render();
    
    try {
      // Call the print service
      const result = await printReceipt(this.printerConnection, this.receiptData);
      
      this.printResult = { 
        success: result.success, 
        message: result.message || 'Receipt printed successfully!' 
      };
    } catch (error) {
      console.error('Error printing receipt:', error);
      this.printResult = { 
        success: false, 
        message: `Error: ${error.message}` 
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
    const title = createElement('h3', { className: 'text-lg font-semibold text-gray-800' }, 'Receipt Preview');
    
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
    
    // Receipt preview
    if (this.receiptData) {
      const previewContainer = createElement('div', { 
        className: 'border border-gray-200 rounded-md p-4 mb-4 font-mono text-sm bg-gray-50' 
      });
      
      // Receipt header
      const receiptHeader = createElement('div', { className: 'text-center mb-3' });
      
      const receiptTitle = createElement('div', { 
        className: 'font-bold text-lg mb-1' 
      }, 'RECEIPT');
      
      const receiptDateTime = createElement('div', {}, 
        `${this.receiptData.date || ''} ${this.receiptData.time || ''}`
      );
      
      receiptHeader.appendChild(receiptTitle);
      receiptHeader.appendChild(receiptDateTime);
      
      // Customer info
      const customerInfo = createElement('div', { className: 'mb-3' });
      
      const customerName = createElement('div', {});
      customerName.appendChild(createElement('span', { className: 'font-semibold' }, 'Customer: '));
      customerName.appendChild(document.createTextNode(this.receiptData.customer_name || 'N/A'));
      
      const checkNumber = createElement('div', {});
      checkNumber.appendChild(createElement('span', { className: 'font-semibold' }, 'Check #: '));
      checkNumber.appendChild(document.createTextNode(this.receiptData.check_number || 'N/A'));
      
      customerInfo.appendChild(customerName);
      customerInfo.appendChild(checkNumber);
      
      if (this.receiptData.payment_type) {
        const paymentType = createElement('div', {});
        paymentType.appendChild(createElement('span', { className: 'font-semibold' }, 'Payment: '));
        paymentType.appendChild(document.createTextNode(this.receiptData.payment_type));
        customerInfo.appendChild(paymentType);
      }
      
      // Amount details
      const amountDetails = createElement('div', { 
        className: 'border-t border-b border-gray-300 py-2 my-2' 
      });
      
      // Subtotal
      const subtotalRow = createElement('div', { className: 'flex justify-between' });
      subtotalRow.appendChild(createElement('span', { className: 'font-semibold' }, 'Subtotal:'));
      subtotalRow.appendChild(createElement('span', {}, this.formatCurrency(this.receiptData.amount)));
      
      // Tip
      const tipRow = createElement('div', { className: 'flex justify-between' });
      tipRow.appendChild(createElement('span', { className: 'font-semibold' }, 'Tip:'));
      tipRow.appendChild(createElement('span', {}, this.formatCurrency(this.receiptData.tip)));
      
      // Total
      const totalRow = createElement('div', { 
        className: 'flex justify-between font-bold mt-1 pt-1 border-t border-gray-300' 
      });
      totalRow.appendChild(createElement('span', {}, 'Total:'));
      totalRow.appendChild(createElement('span', {}, this.formatCurrency(this.receiptData.total)));
      
      amountDetails.appendChild(subtotalRow);
      amountDetails.appendChild(tipRow);
      amountDetails.appendChild(totalRow);
      
      // Signature
      const signatureInfo = createElement('div', { 
        className: 'text-center mt-3 text-xs' 
      }, this.receiptData.signed ? 'Signature on file' : 'Signature not required');
      
      // Add all sections to preview container
      previewContainer.appendChild(receiptHeader);
      previewContainer.appendChild(customerInfo);
      previewContainer.appendChild(amountDetails);
      previewContainer.appendChild(signatureInfo);
      
      wrapper.appendChild(previewContainer);
    } else {
      // No receipt data
      const noDataContainer = createElement('div', { 
        className: 'border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500' 
      }, 'No receipt data available for preview');
      
      wrapper.appendChild(noDataContainer);
    }
    
    // Actions container
    const actionsContainer = createElement('div', { className: 'flex flex-col space-y-2' });
    
    // Print button
    const printButton = createElement('button', {
      className: `flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
        !this.receiptData || !isPrinterConnected 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`,
      disabled: !this.receiptData || !isPrinterConnected || this.isPrinting,
      onClick: !this.receiptData || !isPrinterConnected || this.isPrinting ? null : this.handlePrint
    });
    
    // Printer icon
    const printerIcon = createElement('div', {
      className: 'w-5 h-5',
      innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`
    });
    
    // Refresh icon for printing state
    const refreshIcon = createElement('div', {
      className: 'w-5 h-5 animate-spin',
      innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`
    });
    
    if (this.isPrinting) {
      printButton.appendChild(refreshIcon);
      printButton.appendChild(document.createTextNode('Printing...'));
    } else {
      printButton.appendChild(printerIcon);
      printButton.appendChild(document.createTextNode('Print Receipt'));
    }
    
    actionsContainer.appendChild(printButton);
    
    // Print result message
    if (this.printResult) {
      const resultContainer = createElement('div', {
        className: `mt-2 p-2 rounded-md flex items-center gap-2 ${
          this.printResult.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`
      });
      
      // Icon based on success/failure
      const resultIcon = createElement('div', {
        className: 'w-5 h-5',
        innerHTML: this.printResult.success 
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      });
      
      resultContainer.appendChild(resultIcon);
      resultContainer.appendChild(createElement('span', {}, this.printResult.message));
      
      actionsContainer.appendChild(resultContainer);
    }
    
    // Warning message if printer not connected
    if (!isPrinterConnected) {
      const warningContainer = createElement('div', {
        className: 'mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm'
      }, 'Connect to a printer first to enable printing');
      
      actionsContainer.appendChild(warningContainer);
    }
    
    wrapper.appendChild(actionsContainer);
    
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
    if (document.getElementById('receipt-template-styles')) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'receipt-template-styles';
    
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
   * Update receipt data
   * @param {Object} receiptData - New receipt data
   */
  updateReceiptData(receiptData) {
    this.receiptData = receiptData;
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
