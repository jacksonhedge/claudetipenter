// Simple Epson Printer Integration
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the app
  initApp();
});

// Initialize the app
function initApp() {
  // Get the app container
  const appContainer = document.getElementById('epson-app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }
  
  // Create the UI
  createUI(appContainer);
  
  // Initialize the Epson SDK
  initializeEpsonSDK();
  
  // Set up event listeners
  setupEventListeners();
}

// Create the UI
function createUI(container) {
  container.innerHTML = `
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">TipEnter</h1>
          <p class="text-gray-600">Receipt Processing with Epson Printer</p>
        </div>
        
        <button id="toggle-printer-panel" class="flex items-center px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
          <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Show Printer Panel
        </button>
      </header>
      
      <div id="printer-panel" class="hidden mb-6 border border-gray-200 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <h2 class="text-lg font-medium text-blue-800">Epson Printer Integration</h2>
          </div>
          <div class="flex items-center">
            <span id="sdk-status-indicator" class="inline-block w-3 h-3 rounded-full mr-2 bg-red-500"></span>
            <span id="sdk-status-text" class="text-sm text-gray-600">SDK Not Available</span>
          </div>
        </div>
        
        <div class="bg-white p-6">
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Printer Connection</h3>
            
            <div id="connection-status" class="mb-4">
              <div class="flex items-center">
                <div id="connection-indicator" class="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
                <span id="connection-status-text">No printer connected</span>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-md mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Printer IP Address
                  </label>
                  <input
                    type="text"
                    id="printer-ip"
                    placeholder="192.168.1.100"
                    class="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    id="printer-port"
                    value="8008"
                    placeholder="8008"
                    class="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div class="mt-4">
                <button
                  id="connect-button"
                  class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                >
                  Connect to Printer
                </button>
              </div>
            </div>
            
            <div id="connection-message" class="hidden mt-4 p-3 rounded-md"></div>
          </div>
          
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Print Receipt</h3>
            
            <div class="flex justify-between items-center mb-4">
              <div class="relative w-64">
                <select
                  id="receipt-select"
                  class="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm"
                >
                  <option value="-1">Select a receipt...</option>
                  <!-- Receipt options will be added here dynamically -->
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              <button
                id="print-receipt-button"
                disabled
                class="flex items-center gap-2 py-2 px-4 rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Receipt
              </button>
            </div>
            
            <div id="receipt-preview" class="border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500">
              No receipt selected for preview
            </div>
            
            <div id="print-result" class="hidden mt-2 p-2 rounded-md"></div>
            
            <div id="printer-warning" class="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Connect to a printer first to enable printing
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div class="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">
            Tip Analyzer Tab Content
          </h2>
          <p class="text-gray-500 mb-6">
            This is a placeholder for your existing application content. <br />
            The Epson printer integration panel above provides printing functionality.
          </p>
          
          <div id="receipts-summary" class="mt-4 text-left max-w-md mx-auto hidden">
            <h3 class="text-lg font-medium text-gray-700 mb-2">Processed Receipts Summary:</h3>
            <ul class="list-disc pl-5 text-gray-600">
              <li id="total-receipts">Total receipts: 0</li>
              <li id="total-sales">Total sales amount: $0.00</li>
              <li id="total-tips">Total tips: $0.00</li>
            </ul>
            <div class="mt-4">
              <button
                id="print-all-receipts"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Print All Receipts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize the Epson SDK
async function initializeEpsonSDK() {
  try {
    const result = await window.EpsonPrinterService.initializeEpsonSDK();
    updateSDKStatus(result);
    
    // Load sample receipt data
    loadSampleReceiptData();
  } catch (error) {
    console.error('Error initializing Epson SDK:', error);
    updateSDKStatus({ success: false, error: error.message });
  }
}

// Update SDK status in the UI
function updateSDKStatus(status) {
  const indicator = document.getElementById('sdk-status-indicator');
  const text = document.getElementById('sdk-status-text');
  
  if (!indicator || !text) return;
  
  if (status && status.success) {
    indicator.classList.remove('bg-red-500');
    indicator.classList.add('bg-green-500');
    text.textContent = 'SDK Ready';
  } else {
    indicator.classList.remove('bg-green-500');
    indicator.classList.add('bg-red-500');
    text.textContent = 'SDK Not Available';
  }
}

// Set up event listeners
function setupEventListeners() {
  // Toggle printer panel
  const toggleButton = document.getElementById('toggle-printer-panel');
  const printerPanel = document.getElementById('printer-panel');
  
  if (toggleButton && printerPanel) {
    toggleButton.addEventListener('click', function() {
      const isHidden = printerPanel.classList.contains('hidden');
      
      if (isHidden) {
        printerPanel.classList.remove('hidden');
        toggleButton.innerHTML = `
          <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Hide Printer Panel
        `;
        toggleButton.classList.remove('bg-gray-200', 'text-gray-800');
        toggleButton.classList.add('bg-blue-500', 'text-white');
      } else {
        printerPanel.classList.add('hidden');
        toggleButton.innerHTML = `
          <svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Show Printer Panel
        `;
        toggleButton.classList.remove('bg-blue-500', 'text-white');
        toggleButton.classList.add('bg-gray-200', 'text-gray-800');
      }
    });
  }
  
  // Connect to printer
  const connectButton = document.getElementById('connect-button');
  
  if (connectButton) {
    connectButton.addEventListener('click', async function() {
      const ipAddress = document.getElementById('printer-ip').value;
      const port = document.getElementById('printer-port').value;
      
      if (!ipAddress) {
        alert('Please enter a printer IP address');
        return;
      }
      
      try {
        connectButton.textContent = 'Connecting...';
        connectButton.disabled = true;
        
        const result = await window.EpsonPrinterService.connectToPrinter(ipAddress, port);
        
        updateConnectionStatus(result);
        
        // Update UI based on connection result
        if (result.success) {
          // Show success message
          showConnectionMessage(true, `Successfully connected to printer at ${ipAddress}`);
          
          // Update printer warning
          updatePrinterWarning(true);
          
          // Enable print button if receipt is selected
          const receiptSelect = document.getElementById('receipt-select');
          if (receiptSelect && receiptSelect.value !== '-1') {
            enablePrintButton();
          }
        } else {
          // Show error message
          showConnectionMessage(false, result.error || 'Failed to connect to printer');
        }
      } catch (error) {
        console.error('Error connecting to printer:', error);
        showConnectionMessage(false, error.message || 'Failed to connect to printer');
      } finally {
        connectButton.textContent = 'Connect to Printer';
        connectButton.disabled = false;
      }
    });
  }
  
  // Receipt selector
  const receiptSelect = document.getElementById('receipt-select');
  
  if (receiptSelect) {
    receiptSelect.addEventListener('change', function() {
      const selectedIndex = parseInt(this.value);
      
      if (selectedIndex >= 0 && window.receiptData) {
        updateReceiptPreview(window.receiptData[selectedIndex]);
        
        // Enable print button if printer is connected
        const connectionIndicator = document.getElementById('connection-indicator');
        if (connectionIndicator && connectionIndicator.classList.contains('bg-green-500')) {
          enablePrintButton();
        }
      } else {
        resetReceiptPreview();
        disablePrintButton();
      }
    });
  }
  
  // Print receipt button
  const printButton = document.getElementById('print-receipt-button');
  
  if (printButton) {
    printButton.addEventListener('click', async function() {
      const receiptSelect = document.getElementById('receipt-select');
      
      if (!receiptSelect || receiptSelect.value === '-1' || !window.receiptData) {
        return;
      }
      
      const selectedIndex = parseInt(receiptSelect.value);
      const receiptData = window.receiptData[selectedIndex];
      
      try {
        printButton.disabled = true;
        printButton.innerHTML = `
          <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
          Printing...
        `;
        
        // In a real implementation, this would call the Epson printer service
        // For this example, we'll just simulate a successful print
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showPrintResult(true, 'Receipt printed successfully!');
      } catch (error) {
        console.error('Error printing receipt:', error);
        showPrintResult(false, error.message || 'Failed to print receipt');
      } finally {
        printButton.disabled = false;
        printButton.innerHTML = `
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print Receipt
        `;
      }
    });
  }
  
  // Print all receipts button
  const printAllButton = document.getElementById('print-all-receipts');
  
  if (printAllButton) {
    printAllButton.addEventListener('click', function() {
      // Show the printer panel
      const toggleButton = document.getElementById('toggle-printer-panel');
      const printerPanel = document.getElementById('printer-panel');
      
      if (toggleButton && printerPanel && printerPanel.classList.contains('hidden')) {
        toggleButton.click();
      }
      
      // Alert for demo purposes
      alert('This would print all receipts in a real implementation');
    });
  }
}

// Load sample receipt data
function loadSampleReceiptData() {
  const sampleData = {
    success: true,
    processed_images: 5,
    results: [
      {
        file_name: "receipt_1.jpg",
        date: "03/15/2025",
        time: "18:45",
        customer_name: "John Smith",
        check_number: "1234567",
        amount: "$42.50",
        payment_type: "Credit Card",
        tip: "$8.50",
        total: "$51.00",
        signed: true
      },
      {
        file_name: "receipt_2.jpg",
        date: "03/15/2025",
        time: "19:30",
        customer_name: "Sarah Johnson",
        check_number: "1234568",
        amount: "$36.75",
        payment_type: "Mastercard",
        tip: "$7.25",
        total: "$44.00",
        signed: true
      },
      {
        file_name: "receipt_3.jpg",
        date: "03/15/2025",
        time: "20:15",
        customer_name: "Michael Brown",
        check_number: "1234569",
        amount: "$65.00",
        payment_type: "AMEX",
        tip: "$13.00",
        total: "$78.00",
        signed: true
      },
      {
        file_name: "receipt_4.jpg",
        date: "03/15/2025",
        time: "21:00",
        customer_name: "Emily Davis",
        check_number: "1234570",
        amount: "$28.50",
        payment_type: "Visa",
        tip: "$5.50",
        total: "$34.00",
        signed: false
      },
      {
        file_name: "receipt_5.jpg",
        date: "03/15/2025",
        time: "21:45",
        customer_name: "David Miller",
        check_number: "1234571",
        amount: "$52.25",
        payment_type: "Discover",
        tip: "$10.45",
        total: "$62.70",
        signed: true
      }
    ]
  };
  
  // Store the data
  window.receiptData = sampleData.results;
  
  // Update the receipt selector
  updateReceiptSelector(sampleData.results);
  
  // Update the receipts summary
  updateReceiptsSummary(sampleData.results);
}

// Update the receipt selector
function updateReceiptSelector(receipts) {
  const receiptSelect = document.getElementById('receipt-select');
  
  if (!receiptSelect) return;
  
  // Clear existing options except the first one
  while (receiptSelect.options.length > 1) {
    receiptSelect.remove(1);
  }
  
  // Add receipt options
  receipts.forEach((receipt, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `Receipt #${receipt.check_number} - ${receipt.customer_name}`;
    receiptSelect.appendChild(option);
  });
}

// Update the receipt preview
function updateReceiptPreview(receipt) {
  const receiptPreview = document.getElementById('receipt-preview');
  
  if (!receiptPreview) return;
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  };
  
  receiptPreview.innerHTML = `
    <div class="font-mono text-sm">
      <div class="text-center mb-3">
        <div class="font-bold text-lg mb-1">RECEIPT</div>
        <div>${receipt.date} ${receipt.time}</div>
      </div>
      
      <div class="mb-3">
        <div><span class="font-semibold">Customer: </span>${receipt.customer_name || 'N/A'}</div>
        <div><span class="font-semibold">Check #: </span>${receipt.check_number || 'N/A'}</div>
        ${receipt.payment_type ? `<div><span class="font-semibold">Payment: </span>${receipt.payment_type}</div>` : ''}
      </div>
      
      <div class="border-t border-b border-gray-300 py-2 my-2">
        <div class="flex justify-between">
          <span class="font-semibold">Subtotal:</span>
          <span>${formatCurrency(receipt.amount)}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Tip:</span>
          <span>${formatCurrency(receipt.tip)}</span>
        </div>
        <div class="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300">
          <span>Total:</span>
          <span>${formatCurrency(receipt.total)}</span>
        </div>
      </div>
      
      <div class="text-center mt-3 text-xs">
        ${receipt.signed ? 'Signature on file' : 'Signature not required'}
      </div>
    </div>
  `;
}

// Reset the receipt preview
function resetReceiptPreview() {
  const receiptPreview = document.getElementById('receipt-preview');
  
  if (!receiptPreview) return;
  
  receiptPreview.innerHTML = 'No receipt selected for preview';
}

// Enable the print button
function enablePrintButton() {
  const printButton = document.getElementById('print-receipt-button');
  
  if (!printButton) return;
  
  printButton.disabled = false;
  printButton.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
  printButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white');
}

// Disable the print button
function disablePrintButton() {
  const printButton = document.getElementById('print-receipt-button');
  
  if (!printButton) return;
  
  printButton.disabled = true;
  printButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'text-white');
  printButton.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
}

// Update the receipts summary
function updateReceiptsSummary(receipts) {
  const receiptsSummary = document.getElementById('receipts-summary');
  const totalReceiptsEl = document.getElementById('total-receipts');
  const totalSalesEl = document.getElementById('total-sales');
  const totalTipsEl = document.getElementById('total-tips');
  
  if (!receiptsSummary || !totalReceiptsEl || !totalSalesEl || !totalTipsEl) return;
  
  // Show the summary
  receiptsSummary.classList.remove('hidden');
  
  // Update the summary
  totalReceiptsEl.textContent = `Total receipts: ${receipts.length}`;
  
  // Calculate total sales
  const totalSales = receipts.reduce((sum, receipt) => {
    const amount = parseFloat(String(receipt.amount).replace(/[^\d.-]/g, '') || 0);
    return sum + amount;
  }, 0);
  
  totalSalesEl.textContent = `Total sales amount: $${totalSales.toFixed(2)}`;
  
  // Calculate total tips
  const totalTips = receipts.reduce((sum, receipt) => {
    const tip = parseFloat(String(receipt.tip).replace(/[^\d.-]/g, '') || 0);
    return sum + tip;
  }, 0);
  
  totalTipsEl.textContent = `Total tips: $${totalTips.toFixed(2)}`;
}

// Update connection status in the UI
function updateConnectionStatus(status) {
  const indicator = document.getElementById('connection-indicator');
  const text = document.getElementById('connection-status-text');
  
  if (!indicator || !text) return;
  
  if (status && status.success) {
    indicator.classList.remove('bg-red-500');
    indicator.classList.add('bg-green-500');
    text.textContent = `Connected to ${status.connection.ipAddress}`;
  } else {
    indicator.classList.remove('bg-green-500');
    indicator.classList.add('bg-red-500');
    text.textContent = 'No printer connected';
  }
}

// Show connection message
function showConnectionMessage(success, message) {
  const connectionMessage = document.getElementById('connection-message');
  
  if (!connectionMessage) return;
  
  connectionMessage.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'bg-red-50', 'text-red-700');
  
  if (success) {
    connectionMessage.classList.add('bg-green-50', 'text-green-700');
    connectionMessage.innerHTML = `
      <svg class="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      ${message}
    `;
  } else {
    connectionMessage.classList.add('bg-red-50', 'text-red-700');
    connectionMessage.innerHTML = `
      <svg class="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      ${message}
    `;
  }
}

// Show print result
function showPrintResult(success, message) {
  const printResult = document.getElementById('print-result');
  
  if (!printResult) return;
  
  printResult.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'bg-red-50', 'text-red-700');
  
  if (success) {
    printResult.classList.add('bg-green-50', 'text-green-700');
    printResult.innerHTML = `
      <svg class="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      ${message}
    `;
  } else {
    printResult.classList.add('bg-red-50', 'text-red-700');
    printResult.innerHTML = `
      <svg class="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      ${message}
    `;
  }
}

// Update printer warning
function updatePrinterWarning(printerConnected) {
  const printerWarning = document.getElementById('printer-warning');
  
  if (!printerWarning) return;
  
  if (printerConnected) {
    printerWarning.classList.add('hidden');
  } else {
    printerWarning.classList.remove('hidden');
  }
}
