// Simple Epson Printer App
// This is a simplified version of the Epson printer integration

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the UI
  initializeUI();
  
  // Initialize the Epson SDK
  initializeEpsonSDK();
});

// Initialize the UI
function initializeUI() {
  const appContainer = document.getElementById('epson-app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }
  
  // Create the app UI
  appContainer.innerHTML = `
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">TipEnter</h1>
          <p class="text-gray-600">Receipt Processing with Epson Printer Integration</p>
        </div>
        
        <button id="toggle-printer-panel" class="flex items-center px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Show Printer Panel
        </button>
      </header>
      
      <div id="printer-panel" class="hidden transition-all duration-300 ease-in-out mb-6">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200">
          <div class="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <h2 class="text-lg font-medium text-blue-800">Epson Printer Integration</h2>
            </div>
            <div class="flex items-center">
              <span id="sdk-status-indicator" class="inline-block w-3 h-3 rounded-full mr-2 bg-red-500"></span>
              <span id="sdk-status-text" class="text-sm text-gray-600">SDK Not Available</span>
            </div>
          </div>
          
          <div class="bg-white p-6">
            <div class="border-b border-gray-200 mb-4">
              <nav class="flex">
                <button data-tab="connect" class="py-3 px-4 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Printer Setup
                  </div>
                </button>
                <button data-tab="single" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print Receipt
                  </div>
                </button>
                <button data-tab="batch" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Batch Printing
                  </div>
                </button>
                <button data-tab="settings" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Advanced Settings
                  </div>
                </button>
              </nav>
            </div>
            
            <div id="tab-content" class="p-4">
              <!-- Connect Tab Content -->
              <div id="connect-tab" class="tab-content">
                <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                      Epson Printer Connection
                    </h2>
                    <button id="toggle-settings" class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      Show Settings
                    </button>
                  </div>
                  
                  <div id="connection-status" class="mb-4">
                    <div class="flex items-center">
                      <div id="connection-indicator" class="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
                      <span id="connection-status-text">No printer connected</span>
                    </div>
                  </div>
                  
                  <div id="printer-settings" class="hidden bg-gray-50 p-4 rounded-md mb-4 animate-fadeIn">
                    <h3 class="font-semibold mb-2">Printer Settings</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Printer IP Address
                        </label>
                        <input
                          type="text"
                          id="printer-ip"
                          placeholder="192.168.1.100"
                          class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                          class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div class="mt-4 flex flex-wrap gap-2">
                      <button
                        id="connect-button"
                        class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                  
                  <div id="saved-printers" class="mt-4 hidden">
                    <h3 class="font-semibold mb-2 text-sm text-gray-700">Saved Printers</h3>
                    <div id="saved-printers-list" class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <!-- Saved printers will be added here dynamically -->
                    </div>
                  </div>
                  
                  <div id="connection-message" class="mt-4 hidden">
                    <!-- Connection status messages will be shown here -->
                  </div>
                </div>
              </div>
              
              <!-- Single Print Tab Content -->
              <div id="single-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Print Single Receipt</h3>
                    <div id="receipt-selector" class="relative">
                      <select
                        id="receipt-select"
                        class="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm"
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
                  </div>

                  <div id="receipt-preview" class="border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500">
                    No receipt selected for preview
                  </div>

                  <div class="flex flex-col space-y-2">
                    <button
                      id="print-receipt-button"
                      disabled
                      class="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                      Print Receipt
                    </button>

                    <div id="print-result" class="hidden mt-2 p-2 rounded-md flex items-center gap-2">
                      <!-- Print result message will be shown here -->
                    </div>

                    <div id="printer-warning" class="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                      Connect to a printer first to enable printing
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Batch Print Tab Content -->
              <div id="batch-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Bulk Print Receipts</h3>
                    <div class="flex items-center gap-2">
                      <span id="batch-connection-indicator" class="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                      <span id="batch-connection-text" class="text-sm text-gray-600">Printer Not Connected</span>
                    </div>
                  </div>

                  <div id="batch-receipts-container" class="p-6 text-center text-gray-500 border border-gray-200 rounded-md">
                    No receipts available for printing.
                  </div>

                  <div id="batch-printer-warning" class="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    Connect to a printer first to enable printing
                  </div>
                </div>
              </div>
              
              <!-- Settings Tab Content -->
              <div id="settings-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Printer Settings</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 class="font-medium mb-2 text-gray-700">Paper Settings</h4>
                        <div class="space-y-2">
                          <div>
                            <label class="block text-sm text-gray-600 mb-1">Paper Width</label>
                            <select id="paper-width" class="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                              <option value="58">58mm (2.28")</option>
                              <option value="80" selected>80mm (3.15")</option>
                              <option value="112">112mm (4.41")</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-sm text-gray-600 mb-1">Cut Type</label>
                            <select id="cut-type" class="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                              <option value="full">Full Cut</option>
                              <option value="partial" selected>Partial Cut</option>
                              <option value="none">No Cut</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 class="font-medium mb-2 text-gray-700">Print Options</h4>
                        <div class="space-y-2">
                          <div class="flex items-center">
                            <input type="checkbox" id="print-logo" class="mr-2" checked />
                            <label for="print-logo" class="text-sm text-gray-600">Print Logo</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-barcode" class="mr-2" />
                            <label for="print-barcode" class="text-sm text-gray-600">Print Barcode</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-qrcode" class="mr-2" />
                            <label for="print-qrcode" class="text-sm text-gray-600">Print QR Code</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-duplicate" class="mr-2" />
                            <label for="print-duplicate" class="text-sm text-gray-600">Print Duplicate Copy</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                      <button id="reset-settings" class="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2">
                        Reset to Defaults
                      </button>
                      <button id="save-settings" class="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
  
  // Add event listeners
  setupEventListeners();
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
  
  toggleButton.addEventListener('click', function() {
    const isHidden = printerPanel.classList.contains('hidden');
    
    if (isHidden) {
      printerPanel.classList.remove('hidden');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Hide Printer Panel
      `;
      toggleButton.classList.remove('bg-gray-200', 'text-gray-800');
      toggleButton.classList.add('bg-blue-500', 'text-white');
    } else {
      printerPanel.classList.add('hidden');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Show Printer Panel
      `;
      toggleButton.classList.remove('bg-blue-500', 'text-white');
      toggleButton.classList.add('bg-gray-200', 'text-gray-800');
    }
  });
  
  // Toggle printer settings
  const toggleSettings = document.getElementById('toggle-settings');
  const printerSettings = document.getElementById('printer-settings');
  
  toggleSettings.addEventListener('click', function() {
    const isHidden = printerSettings.classList.contains('hidden');
    
    if (isHidden) {
      printerSettings.classList.remove('hidden');
      toggleSettings.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Hide Settings
      `;
    } else {
      printerSettings.classList.add('hidden');
      toggleSettings.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Show Settings
      `;
    }
  });
  
  // Tab navigation
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.remove('text-gray-500');
          btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-500');
        } else {
          btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-500');
          btn.classList.add('text-gray-500');
        }
      });
      
      // Show active tab content
      tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });
  
  // Connect to printer
  const connectButton = document.getElementById('connect-button');
  
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
        
        // Update connection status in other tabs
        updatePrinterStatusInTabs(true);
        
        // Add to saved printers if not already in the list
        addToSavedPrinters(ipAddress, port);
      } else {
        // Show error message
        showConnectionMessage(false, result.error || 'Failed to connect to printer');
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      showConnectionMessage(false, error.message || 'Failed to connect to printer');
    } finally {
      connectButton.textContent = 'Connect';
      connectButton.disabled = false;
    }
  });
  
  // Print all receipts button
  const printAllButton = document.getElementById('print-all-receipts');
  
  printAllButton.addEventListener('click', function() {
    // Switch to printer panel and batch tab
    document.getElementById('toggle-printer-panel').click();
    document.querySelector('[data-tab="batch"]').click();
  });
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
  
  // Update the batch receipts container
  updateBatchReceiptsContainer(sampleData.results);
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
  
  // Add change event listener
  receiptSelect.addEventListener('change', function() {
    const selectedIndex = parseInt(this.value);
    
    if (selectedIndex >= 0) {
      updateReceiptPreview(receipts[selectedIndex]);
      enablePrintButton();
    } else {
      resetReceiptPreview();
      disablePrintButton();
    }
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
  
  if (!receiptsSummary) return;
  
  // Show the summary
  receiptsSummary.classList.remove('hidden');
  
  // Update the summary
  document.getElementById('total-receipts').textContent = `Total receipts: ${receipts.length}`;
  
  // Calculate total sales
  const totalSales = receipts.reduce((sum, receipt) => {
    const amount = parseFloat(String(receipt.amount).replace(/[^\d.-]/g, '') || 0);
    return sum + amount;
  }, 0);
  
  document.getElementById('total-sales').textContent = `Total sales amount: $${totalSales.toFixed(2)}`;
  
  // Calculate total tips
  const totalTips = receipts.reduce((sum, receipt) => {
    const tip = parseFloat(String(receipt.tip).replace(/[^\d.-]/g, '') || 0);
    return sum + tip;
  }, 0);
  
  document.getElementById('total-tips').textContent = `Total tips: $${totalTips.toFixed(2)}`;
}

// Update the batch receipts container
function updateBatchReceiptsContainer(receipts) {
  const batchContainer = document.getElementById('batch-receipts-container');
  
  if (!batchContainer) return;
  
  if (receipts.length === 0) {
    batchContainer.innerHTML = 'No receipts available for printing.';
    return;
  }
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  };
  
  // Create batch UI
  batchContainer.innerHTML = `
    <div class="flex items-center mb-3 p-2 bg-gray-50 rounded-md">
      <input type="checkbox" id="select-all" class="mr-2">
      <label for="select-all" class="text-sm font-medium">Select All Receipts</label>
      
      <button id="print-selected" class="ml-auto flex items-center gap-2 py-1 px-3 rounded-md bg-gray-300 text-gray-500 cursor-not-allowed" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Selected (0)
      </button>
    </div>
    
    <div class="space-y-2 max-h-80 overflow-y-auto">
      ${receipts.map((receipt, index) => `
        <div class="border rounded-md border-gray-200">
          <div class="flex items-center p-3 cursor-pointer receipt-item" data-index="${index}">
            <input type="checkbox" class="mr-3 receipt-checkbox" data-index="${index}">
            
            <div class="flex-1">
              <div class="font-medium">Receipt #${receipt.check_number || index + 1}</div>
              <div class="text-sm text-gray-600">
                ${receipt.customer_name || 'Unknown'} - ${receipt.date || 'No date'} - ${formatCurrency(receipt.total)}
              </div>
            </div>
            
            <button class="ml-2 text-gray-500 hover:text-gray-700 receipt-expand" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
          
          <div class="p-3 pt-0 border-t border-gray-200 bg-gray-50 hidden receipt-details" data-index="${index}">
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Customer</td>
                  <td class="py-1 text-right">${receipt.customer_name || 'N/A'}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Check #</td>
                  <td class="py-1 text-right">${receipt.check_number || 'N/A'}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Date</td>
                  <td class="py-1 text-right">${receipt.date || 'N/A'}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Time</td>
                  <td class="py-1 text-right">${receipt.time || 'N/A'}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Payment</td>
                  <td class="py-1 text-right">${receipt.payment_type || 'N/A'}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Subtotal</td>
                  <td class="py-1 text-right">${formatCurrency(receipt.amount)}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Tip</td>
                  <td class="py-1 text-right">${formatCurrency(receipt.tip)}</td>
                </tr>
                <tr class="border-b border-gray-200">
                  <td class="py-1 font-medium">Total</td>
                  <td class="py-1 text-right">${formatCurrency(receipt.total)}</td>
                </tr>
                <tr>
                  <td class="py-1 font-medium">Signed</td>
                  <td class="py-1 text-right">${receipt.signed ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add event listeners for batch UI
  setupBatchEventListeners();
}

// Set up batch event listeners
function setupBatchEventListeners() {
  // Select all checkbox
  const selectAllCheckbox = document.getElementById('select-all');
  const receiptCheckboxes = document.querySelectorAll('.receipt-checkbox');
  
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      
      receiptCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
      });
      
      updatePrintSelectedButton();
    });
  }
  
  // Receipt checkboxes
  receiptCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updatePrintSelectedButton();
      
      // Update select all checkbox
      if (selectAllCheckbox) {
        const allChecked = Array.from(receiptCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
      }
    });
  });
  
  // Receipt items (for toggling checkboxes)
  const receiptItems = document.querySelectorAll('.receipt-item');
  
  receiptItems.forEach(item => {
    item.addEventListener('click', function(event) {
      // Ignore clicks on the checkbox or expand button
      if (event.target.classList.contains('receipt-checkbox') || 
          event.target.classList.contains('receipt-expand') ||
          event.target.closest('.receipt-expand')) {
        return;
      }
      
      const index = this.getAttribute('data-index');
      const checkbox = document.querySelector(`.receipt-checkbox[data-index="${index}"]`);
      
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  });
  
  // Receipt expand buttons
  const expandButtons = document.querySelectorAll('.receipt-expand');
  
  expandButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const details = document.querySelector(`.receipt-details[data-index="${index}"]`);
      
      if (details) {
        const isHidden = details.classList.contains('hidden');
        
        if (isHidden) {
          details.classList.remove('hidden');
          this.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          `;
        } else {
          details.classList.add('hidden');
          this.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          `;
        }
      }
    });
  });
  
  // Print selected button
  const printSelectedButton = document.getElementById('print-selected');
  
  if (printSelectedButton) {
    printSelectedButton.addEventListener('click', function() {
      const selectedIndices = [];
      
      receiptCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedIndices.push(parseInt(checkbox.getAttribute('data-index')));
        }
      });
      
      if (selectedIndices.length > 0) {
        printSelectedReceipts(selectedIndices);
      }
    });
  }
}

// Update the print selected button
function updatePrintSelectedButton() {
  const printSelectedButton = document.getElementById('print-selected');
  const receiptCheckboxes = document.querySelectorAll('.receipt-checkbox');
  
  if (!printSelectedButton) return;
  
  const selectedCount = Array.from(receiptCheckboxes).filter(cb => cb.checked).length;
  
  if (selectedCount > 0) {
    printSelectedButton.disabled = false;
    printSelectedButton.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    printSelectedButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white');
    printSelectedButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print Selected (${selectedCount})
    `;
  } else {
    printSelectedButton.disabled = true;
    printSelectedButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'text-white');
    printSelectedButton.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    printSelectedButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print Selected (0)
    `;
  }
}

// Print selected receipts
function printSelectedReceipts(selectedIndices) {
  // This is a placeholder function
  console.log('Printing selected receipts:', selectedIndices);
  
  // In a real implementation, this would call the Epson printer service
  alert(`Printing ${selectedIndices.length} receipts...`);
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
// Simple Epson Printer App
// This is a simplified version of the Epson printer integration

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the UI
  initializeUI();
  
  // Initialize the Epson SDK
  initializeEpsonSDK();
});

// Initialize the UI
function initializeUI() {
  const appContainer = document.getElementById('epson-app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }
  
  // Create the app UI
  appContainer.innerHTML = `
    <div class="container mx-auto p-4">
      <header class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">TipEnter</h1>
          <p class="text-gray-600">Receipt Processing with Epson Printer Integration</p>
        </div>
        
        <button id="toggle-printer-panel" class="flex items-center px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Show Printer Panel
        </button>
      </header>
      
      <div id="printer-panel" class="hidden transition-all duration-300 ease-in-out mb-6">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200">
          <div class="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <h2 class="text-lg font-medium text-blue-800">Epson Printer Integration</h2>
            </div>
            <div class="flex items-center">
              <span id="sdk-status-indicator" class="inline-block w-3 h-3 rounded-full mr-2 bg-red-500"></span>
              <span id="sdk-status-text" class="text-sm text-gray-600">SDK Not Available</span>
            </div>
          </div>
          
          <div class="bg-white p-6">
            <div class="border-b border-gray-200 mb-4">
              <nav class="flex">
                <button data-tab="connect" class="py-3 px-4 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Printer Setup
                  </div>
                </button>
                <button data-tab="single" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print Receipt
                  </div>
                </button>
                <button data-tab="batch" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Batch Printing
                  </div>
                </button>
                <button data-tab="settings" class="py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Advanced Settings
                  </div>
                </button>
              </nav>
            </div>
            
            <div id="tab-content" class="p-4">
              <!-- Connect Tab Content -->
              <div id="connect-tab" class="tab-content">
                <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                      Epson Printer Connection
                    </h2>
                    <button id="toggle-settings" class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      Show Settings
                    </button>
                  </div>
                  
                  <div id="connection-status" class="mb-4">
                    <div class="flex items-center">
                      <div id="connection-indicator" class="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
                      <span id="connection-status-text">No printer connected</span>
                    </div>
                  </div>
                  
                  <div id="printer-settings" class="hidden bg-gray-50 p-4 rounded-md mb-4 animate-fadeIn">
                    <h3 class="font-semibold mb-2">Printer Settings</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Printer IP Address
                        </label>
                        <input
                          type="text"
                          id="printer-ip"
                          placeholder="192.168.1.100"
                          class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                          class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div class="mt-4 flex flex-wrap gap-2">
                      <button
                        id="connect-button"
                        class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                  
                  <div id="saved-printers" class="mt-4 hidden">
                    <h3 class="font-semibold mb-2 text-sm text-gray-700">Saved Printers</h3>
                    <div id="saved-printers-list" class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <!-- Saved printers will be added here dynamically -->
                    </div>
                  </div>
                  
                  <div id="connection-message" class="mt-4 hidden">
                    <!-- Connection status messages will be shown here -->
                  </div>
                </div>
              </div>
              
              <!-- Single Print Tab Content -->
              <div id="single-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Print Single Receipt</h3>
                    <div id="receipt-selector" class="relative">
                      <select
                        id="receipt-select"
                        class="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm"
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
                  </div>

                  <div id="receipt-preview" class="border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500">
                    No receipt selected for preview
                  </div>

                  <div class="flex flex-col space-y-2">
                    <button
                      id="print-receipt-button"
                      disabled
                      class="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                      Print Receipt
                    </button>

                    <div id="print-result" class="hidden mt-2 p-2 rounded-md flex items-center gap-2">
                      <!-- Print result message will be shown here -->
                    </div>

                    <div id="printer-warning" class="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                      Connect to a printer first to enable printing
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Batch Print Tab Content -->
              <div id="batch-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Bulk Print Receipts</h3>
                    <div class="flex items-center gap-2">
                      <span id="batch-connection-indicator" class="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                      <span id="batch-connection-text" class="text-sm text-gray-600">Printer Not Connected</span>
                    </div>
                  </div>

                  <div id="batch-receipts-container" class="p-6 text-center text-gray-500 border border-gray-200 rounded-md">
                    No receipts available for printing.
                  </div>

                  <div id="batch-printer-warning" class="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    Connect to a printer first to enable printing
                  </div>
                </div>
              </div>
              
              <!-- Settings Tab Content -->
              <div id="settings-tab" class="tab-content hidden">
                <div class="space-y-4">
                  <div class="p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Printer Settings</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 class="font-medium mb-2 text-gray-700">Paper Settings</h4>
                        <div class="space-y-2">
                          <div>
                            <label class="block text-sm text-gray-600 mb-1">Paper Width</label>
                            <select id="paper-width" class="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                              <option value="58">58mm (2.28")</option>
                              <option value="80" selected>80mm (3.15")</option>
                              <option value="112">112mm (4.41")</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-sm text-gray-600 mb-1">Cut Type</label>
                            <select id="cut-type" class="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                              <option value="full">Full Cut</option>
                              <option value="partial" selected>Partial Cut</option>
                              <option value="none">No Cut</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 class="font-medium mb-2 text-gray-700">Print Options</h4>
                        <div class="space-y-2">
                          <div class="flex items-center">
                            <input type="checkbox" id="print-logo" class="mr-2" checked />
                            <label for="print-logo" class="text-sm text-gray-600">Print Logo</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-barcode" class="mr-2" />
                            <label for="print-barcode" class="text-sm text-gray-600">Print Barcode</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-qrcode" class="mr-2" />
                            <label for="print-qrcode" class="text-sm text-gray-600">Print QR Code</label>
                          </div>
                          <div class="flex items-center">
                            <input type="checkbox" id="print-duplicate" class="mr-2" />
                            <label for="print-duplicate" class="text-sm text-gray-600">Print Duplicate Copy</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                      <button id="reset-settings" class="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2">
                        Reset to Defaults
                      </button>
                      <button id="save-settings" class="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
  
  // Add event listeners
  setupEventListeners();
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
  
  toggleButton.addEventListener('click', function() {
    const isHidden = printerPanel.classList.contains('hidden');
    
    if (isHidden) {
      printerPanel.classList.remove('hidden');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Hide Printer Panel
      `;
      toggleButton.classList.remove('bg-gray-200', 'text-gray-800');
      toggleButton.classList.add('bg-blue-500', 'text-white');
    } else {
      printerPanel.classList.add('hidden');
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Show Printer Panel
      `;
      toggleButton.classList.remove('bg-blue-500', 'text-white');
      toggleButton.classList.add('bg-gray-200', 'text-gray-800');
    }
  });
  
  // Toggle printer settings
  const toggleSettings = document.getElementById('toggle-settings');
  const printerSettings = document.getElementById('printer-settings');
  
  toggleSettings.addEventListener('click', function() {
    const isHidden = printerSettings.classList.contains('hidden');
    
    if (isHidden) {
      printerSettings.classList.remove('hidden');
      toggleSettings.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1"
