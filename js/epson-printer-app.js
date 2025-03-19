// Define React components for Epson Printer Integration
// This file combines all the components into a single file to avoid module loading issues

// ReceiptTemplate Component
const ReceiptTemplate = ({ receiptData, onPrint, printerConnection }) => {
  const [isPrinting, React.useState(false)];
  const [printResult, React.useState(null)];
  
  // Format currency values for display
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    
    // Remove any existing $ sign and convert to number
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  };

  const handlePrint = async () => {
    if (!receiptData) return;
    
    setPrinting(true);
    setPrintResult(null);
    
    try {
      // Call the onPrint callback which should handle the printing logic
      const result = await onPrint(receiptData);
      setPrintResult({ success: true, message: 'Receipt printed successfully!' });
    } catch (error) {
      console.error('Error printing receipt:', error);
      setPrintResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setPrinting(false);
    }
  };

  // Check if printer is connected
  const isPrinterConnected = printerConnection && printerConnection.success;

  return React.createElement('div', { className: "bg-white p-4 sm:p-6 rounded-lg shadow-md" },
    // Header
    React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0" },
      React.createElement('h3', { className: "text-lg font-semibold text-gray-800" }, "Receipt Preview"),
      React.createElement('div', { className: "flex items-center gap-2" },
        React.createElement('span', { className: `inline-block w-3 h-3 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-red-500'}` }),
        React.createElement('span', { className: "text-sm text-gray-600" }, 
          isPrinterConnected ? 'Printer Connected' : 'Printer Not Connected'
        )
      )
    ),

    // Receipt Preview
    receiptData ? 
      React.createElement('div', { className: "border border-gray-200 rounded-md p-4 mb-4 font-mono text-sm bg-gray-50" },
        React.createElement('div', { className: "text-center mb-3" },
          React.createElement('div', { className: "font-bold text-lg mb-1" }, "RECEIPT"),
          React.createElement('div', null, `${receiptData.date} ${receiptData.time}`)
        ),
        
        React.createElement('div', { className: "mb-3" },
          React.createElement('div', null, 
            React.createElement('span', { className: "font-semibold" }, "Customer: "), 
            receiptData.customer_name || 'N/A'
          ),
          React.createElement('div', null, 
            React.createElement('span', { className: "font-semibold" }, "Check #: "), 
            receiptData.check_number || 'N/A'
          ),
          receiptData.payment_type && React.createElement('div', null, 
            React.createElement('span', { className: "font-semibold" }, "Payment: "), 
            receiptData.payment_type
          )
        ),
        
        React.createElement('div', { className: "border-t border-b border-gray-300 py-2 my-2" },
          React.createElement('div', { className: "flex justify-between" },
            React.createElement('span', { className: "font-semibold" }, "Subtotal:"),
            React.createElement('span', null, formatCurrency(receiptData.amount))
          ),
          React.createElement('div', { className: "flex justify-between" },
            React.createElement('span', { className: "font-semibold" }, "Tip:"),
            React.createElement('span', null, formatCurrency(receiptData.tip))
          ),
          React.createElement('div', { className: "flex justify-between font-bold mt-1 pt-1 border-t border-gray-300" },
            React.createElement('span', null, "Total:"),
            React.createElement('span', null, formatCurrency(receiptData.total))
          )
        ),
        
        React.createElement('div', { className: "text-center mt-3 text-xs" },
          receiptData.signed ? 'Signature on file' : 'Signature not required'
        )
      ) : 
      React.createElement('div', { className: "border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500" },
        "No receipt data available for preview"
      ),

    // Print Button and Status
    React.createElement('div', { className: "flex flex-col space-y-2" },
      React.createElement('button', {
        onClick: handlePrint,
        disabled: !receiptData || !isPrinterConnected || isPrinting,
        className: `flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
          !receiptData || !isPrinterConnected 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`
      },
        isPrinting ? 
          React.createElement(React.Fragment, null,
            React.createElement(RefreshCw, { className: "w-5 h-5 animate-spin" }),
            "Printing..."
          ) : 
          React.createElement(React.Fragment, null,
            React.createElement(Printer, { className: "w-5 h-5" }),
            "Print Receipt"
          )
      ),

      printResult && React.createElement('div', { 
        className: `mt-2 p-2 rounded-md flex items-center gap-2 ${
          printResult.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`
      },
        printResult.success 
          ? React.createElement(CheckCircle, { className: "w-5 h-5" }) 
          : React.createElement(AlertCircle, { className: "w-5 h-5" }),
        React.createElement('span', null, printResult.message)
      ),

      !isPrinterConnected && React.createElement('div', { className: "mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm" },
        "Connect to a printer first to enable printing"
      )
    )
  );
};

// BulkPrintComponent
const BulkPrintComponent = ({ receipts, printerConnection, onPrintBatch }) => {
  const [selectedReceipts, setSelectedReceipts] = React.useState([]);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [printResults, setPrintResults] = React.useState(null);
  const [expandedReceipt, setExpandedReceipt] = React.useState(null);
  const [selectAll, setSelectAll] = React.useState(false);

  // Update selected receipts when receipts prop changes
  React.useEffect(() => {
    setSelectedReceipts([]);
    setSelectAll(false);
  }, [receipts]);

  // Handle select all checkbox
  React.useEffect(() => {
    if (selectAll) {
      setSelectedReceipts(receipts.map((_, index) => index));
    } else if (selectedReceipts.length === receipts.length) {
      setSelectedReceipts([]);
    }
  }, [selectAll, receipts]);

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  };

  // Toggle receipt selection
  const toggleReceiptSelection = (index) => {
    if (selectedReceipts.includes(index)) {
      setSelectedReceipts(selectedReceipts.filter(i => i !== index));
    } else {
      setSelectedReceipts([...selectedReceipts, index]);
    }
  };

  // Toggle receipt expanded view
  const toggleExpandReceipt = (index) => {
    if (expandedReceipt === index) {
      setExpandedReceipt(null);
    } else {
      setExpandedReceipt(index);
    }
  };

  // Handle bulk printing
  const handlePrintSelected = async () => {
    if (selectedReceipts.length === 0) return;
    
    setIsPrinting(true);
    setPrintResults(null);
    
    try {
      // Get only the selected receipts
      const receiptsToPrint = selectedReceipts.map(index => receipts[index]);
      
      // Call the onPrintBatch callback
      const results = await onPrintBatch(receiptsToPrint);
      
      setPrintResults({
        success: true,
        totalPrinted: results.successfulPrints,
        totalFailed: results.failedPrints,
        details: results.results
      });
    } catch (error) {
      console.error('Error printing batch receipts:', error);
      setPrintResults({
        success: false,
        message: error.message,
        details: []
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Check if printer is connected
  const isPrinterConnected = printerConnection && printerConnection.success;

  return React.createElement('div', { className: "bg-white p-4 sm:p-6 rounded-lg shadow-md" },
    // Header
    React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0" },
      React.createElement('h3', { className: "text-lg font-semibold text-gray-800" }, "Bulk Print Receipts"),
      React.createElement('div', { className: "flex items-center gap-2" },
        React.createElement('span', { className: `inline-block w-3 h-3 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-red-500'}` }),
        React.createElement('span', { className: "text-sm text-gray-600" }, 
          isPrinterConnected ? 'Printer Connected' : 'Printer Not Connected'
        )
      )
    ),

    // Receipt List
    receipts.length > 0 ? 
      React.createElement(React.Fragment, null,
        // Select All Bar
        React.createElement('div', { className: "flex items-center mb-3 p-2 bg-gray-50 rounded-md" },
          React.createElement('input', {
            type: "checkbox",
            id: "select-all",
            checked: selectAll,
            onChange: () => setSelectAll(!selectAll),
            className: "mr-2"
          }),
          React.createElement('label', { htmlFor: "select-all", className: "text-sm font-medium" }, "Select All Receipts"),
          
          React.createElement('button', {
            onClick: handlePrintSelected,
            disabled: selectedReceipts.length === 0 || !isPrinterConnected || isPrinting,
            className: `ml-auto flex items-center gap-2 py-1 px-3 rounded-md ${
              selectedReceipts.length === 0 || !isPrinterConnected || isPrinting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`
          },
            isPrinting ? 
              React.createElement(React.Fragment, null,
                React.createElement(RefreshCw, { className: "w-4 h-4 animate-spin" }),
                "Printing..."
              ) : 
              React.createElement(React.Fragment, null,
                React.createElement(Printer, { className: "w-4 h-4" }),
                `Print Selected (${selectedReceipts.length})`
              )
          )
        ),

        // Receipt List
        React.createElement('div', { className: "space-y-2 max-h-80 overflow-y-auto" },
          receipts.map((receipt, index) => {
            const isSelected = selectedReceipts.includes(index);
            const isExpanded = expandedReceipt === index;
            
            return React.createElement('div', {
              key: index,
              className: `border rounded-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`
            },
              // Receipt Header (Clickable)
              React.createElement('div', {
                className: "flex items-center p-3 cursor-pointer",
                onClick: () => toggleReceiptSelection(index)
              },
                React.createElement('input', {
                  type: "checkbox",
                  checked: isSelected,
                  onChange: () => toggleReceiptSelection(index),
                  className: "mr-3",
                  onClick: (e) => e.stopPropagation()
                }),
                
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "font-medium" }, `Receipt #${receipt.check_number || index + 1}`),
                  React.createElement('div', { className: "text-sm text-gray-600" },
                    `${receipt.customer_name || 'Unknown'} - ${receipt.date || 'No date'} - ${formatCurrency(receipt.total)}`
                  )
                ),
                
                React.createElement('button', {
                  className: "ml-2 text-gray-500 hover:text-gray-700",
                  onClick: (e) => {
                    e.stopPropagation();
                    toggleExpandReceipt(index);
                  }
                },
                  isExpanded ? 
                    React.createElement(ChevronUp, { className: "w-5 h-5" }) : 
                    React.createElement(ChevronDown, { className: "w-5 h-5" })
                )
              ),
              
              // Receipt Details (Expandable)
              isExpanded && React.createElement('div', { className: "p-3 pt-0 border-t border-gray-200 bg-gray-50" },
                React.createElement('table', { className: "w-full text-sm" },
                  React.createElement('tbody', null,
                    [
                      { label: "Customer", value: receipt.customer_name || 'N/A' },
                      { label: "Check #", value: receipt.check_number || 'N/A' },
                      { label: "Date", value: receipt.date || 'N/A' },
                      { label: "Time", value: receipt.time || 'N/A' },
                      { label: "Payment", value: receipt.payment_type || 'N/A' },
                      { label: "Subtotal", value: formatCurrency(receipt.amount) },
                      { label: "Tip", value: formatCurrency(receipt.tip) },
                      { label: "Total", value: formatCurrency(receipt.total) },
                      { label: "Signed", value: receipt.signed ? 'Yes' : 'No' }
                    ].map((row, i) => 
                      React.createElement('tr', { key: i, className: i < 8 ? "border-b border-gray-200" : "" },
                        React.createElement('td', { className: "py-1 font-medium" }, row.label),
                        React.createElement('td', { className: "py-1 text-right" }, row.value)
                      )
                    )
                  )
                )
              )
            );
          })
        ),
        
        // Print Results
        printResults && React.createElement('div', {
          className: `mt-4 p-3 rounded-md ${
            printResults.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`
        },
          React.createElement('div', { className: "flex items-center gap-2 mb-2" },
            printResults.success ? 
              React.createElement(CheckCircle, { className: "w-5 h-5 text-green-600" }) : 
              React.createElement(AlertCircle, { className: "w-5 h-5 text-red-600" }),
            React.createElement('span', { className: "font-medium" },
              printResults.success ? 'Print job completed' : 'Print job failed'
            )
          ),
          
          printResults.success ? 
            React.createElement('div', { className: "text-sm" },
              `Successfully printed ${printResults.totalPrinted} of ${printResults.totalPrinted + printResults.totalFailed} receipts.`,
              printResults.totalFailed > 0 && React.createElement('div', null, `Failed to print ${printResults.totalFailed} receipts.`)
            ) : 
            React.createElement('div', { className: "text-sm text-red-600" },
              printResults.message || 'Unknown error occurred during printing.'
            )
        )
      ) : 
      React.createElement('div', { className: "p-6 text-center text-gray-500 border border-gray-200 rounded-md" },
        "No receipts available for printing."
      ),

    // Printer Connection Warning
    !isPrinterConnected && React.createElement('div', { className: "mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm" },
      "Connect to a printer first to enable printing"
    )
  );
};

// EpsonPrinterConnect Component
const EpsonPrinterConnect = ({ onConnect, onDisconnect, currentConnection, printerStatus }) => {
  const [printerIP, setPrinterIP] = React.useState('');
  const [printerPort, setPrinterPort] = React.useState('8008');
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [savedPrinters, setSavedPrinters] = React.useState([]);
  const [showSettings, setShowSettings] = React.useState(false);

  // Load saved printers from localStorage on component mount
  React.useEffect(() => {
    const savedPrintersData = localStorage.getItem('epsonPrinters');
    if (savedPrintersData) {
      try {
        setSavedPrinters(JSON.parse(savedPrintersData));
      } catch (e) {
        console.error('Error loading saved printers:', e);
      }
    }
  }, []);

  // Save printers to localStorage
  const savePrinters = (printers) => {
    if (printers.length > 0) {
      localStorage.setItem('epsonPrinters', JSON.stringify(printers));
    }
  };

  // Handle printer connection
  const handleConnect = async () => {
    if (!printerIP) {
      return;
    }

    setIsConnecting(true);

    try {
      const result = await onConnect(printerIP, printerPort);

      if (result.success) {
        // Add to saved printers if not already in the list
        if (!savedPrinters.some(printer => printer.ip === printerIP)) {
          const updatedPrinters = [
            ...savedPrinters,
            {
              ip: printerIP,
              port: printerPort,
              name: `Epson Printer (${printerIP})`
            }
          ];
          setSavedPrinters(updatedPrinters);
          savePrinters(updatedPrinters);
        }
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle printer disconnection
  const handleDisconnect = () => {
    onDisconnect();
  };

  // Connect to a saved printer
  const connectToSavedPrinter = (printer) => {
    setPrinterIP(printer.ip);
    setPrinterPort(printer.port || '8008');
    handleConnect();
  };

  // Remove a saved printer
  const removeSavedPrinter = (printerToRemove) => {
    const updatedPrinters = savedPrinters.filter(printer => printer.ip !== printerToRemove.ip);
    setSavedPrinters(updatedPrinters);
    savePrinters(updatedPrinters);
  };

  // Check if a printer is connected
  const isPrinterConnected = currentConnection && currentConnection.success;

  return React.createElement('div', { className: "bg-white p-4 sm:p-6 rounded-lg shadow-md" },
    // Header
    React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0" },
      React.createElement('h2', { className: "text-xl font-bold text-gray-800 flex items-center" },
        React.createElement(Printer, { className: "w-6 h-6 mr-2" }),
        "Epson Printer Connection"
      ),
      React.createElement('button', {
        onClick: () => setShowSettings(!showSettings),
        className: "bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md flex items-center"
      },
        React.createElement(Settings, { className: "w-4 h-4 mr-1" }),
        showSettings ? 'Hide Settings' : 'Show Settings'
      )
    ),

    // Connection Status or Settings
    !showSettings ? 
      React.createElement('div', { className: "mb-4" },
        React.createElement('div', { className: "flex items-center" },
          React.createElement('div', { 
            className: `w-3 h-3 rounded-full mr-2 ${isPrinterConnected ? 'bg-green-500' : 'bg-red-500'}`
          }),
          React.createElement('span', null,
            isPrinterConnected
              ? `Connected to ${currentConnection.connection.ipAddress}`
              : 'No printer connected'
          )
        ),

        isPrinterConnected && printerStatus && React.createElement('div', { className: "mt-2 text-sm text-gray-600" },
          React.createElement('div', { className: "grid grid-cols-2 gap-x-4 gap-y-1 mt-1" },
            React.createElement('div', { className: "flex justify-between" },
              React.createElement('span', { className: "font-medium" }, "Online:"),
              React.createElement('span', null, printerStatus.status.online ? 'Yes' : 'No')
            ),
            React.createElement('div', { className: "flex justify-between" },
              React.createElement('span', { className: "font-medium" }, "Paper:"),
              React.createElement('span', null, printerStatus.status.paper === 'ok' ? 'OK' : 'Low')
            ),
            React.createElement('div', { className: "flex justify-between" },
              React.createElement('span', { className: "font-medium" }, "Cover:"),
              React.createElement('span', null, printerStatus.status.cover)
            ),
            React.createElement('div', { className: "flex justify-between" },
              React.createElement('span', { className: "font-medium" }, "Drawer:"),
              React.createElement('span', null, printerStatus.status.drawer)
            )
          ),

          React.createElement('button', {
            onClick: () => onConnect(currentConnection.connection.ipAddress, currentConnection.connection.port),
            className: "mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
          },
            React.createElement(RefreshCw, { className: "w-3 h-3 mr-1" }),
            "Refresh Status"
          )
        )
      ) : 
      React.createElement('div', { className: "bg-gray-50 p-4 rounded-md mb-4 animate-fadeIn" },
        React.createElement('h3', { className: "font-semibold mb-2" }, "Printer Settings"),
        
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, "Printer IP Address"),
            React.createElement('input', {
              type: "text",
              value: printerIP,
              onChange: (e) => setPrinterIP(e.target.value),
              placeholder: "192.168.1.100",
              className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
              disabled: isPrinterConnected
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, "Port"),
            React.createElement('input', {
              type: "text",
              value: printerPort,
              onChange: (e) => setPrinterPort(e.target.value),
              placeholder: "8008",
              className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
              disabled: isPrinterConnected
            })
          )
        ),
        
        React.createElement('div', { className: "mt-4 flex flex-wrap gap-2" },
          !isPrinterConnected ? 
            React.createElement('button', {
              className: "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-blue-300",
              disabled: isConnecting || !printerIP,
              onClick: handleConnect
            },
              isConnecting ? 'Connecting...' : 'Connect'
            ) : 
            React.createElement(React.Fragment, null,
              React.createElement('button', {
                className: "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md",
                onClick: handleDisconnect
              },
                "Disconnect"
              ),
              React.createElement('button', {
                className: "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md",
                onClick: () => {
                  alert('Test print functionality would be triggered here');
                }
              },
                "Test Print"
              )
            )
        )
      ),

    // Saved Printers
    savedPrinters.length > 0 && React.createElement('div', { className: "mt-4" },
      React.createElement('h3', { className: "font-semibold mb-2 text-sm text-gray-700" }, "Saved Printers"),
      
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        savedPrinters.map((printer, index) => 
          React.createElement('div', {
            key: index,
            className: "flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
          },
            React.createElement('div', { className: "flex flex-col" },
              React.createElement('span', { className: "font-medium" }, printer.name || 'Unnamed Printer'),
              React.createElement('span', { className: "text-xs text-gray-500" }, `${printer.ip}:${printer.port || '8008'}`)
            ),
            
            React.createElement('div', { className: "flex gap-2" },
              isPrinterConnected && currentConnection.connection.ipAddress === printer.ip ? 
                React.createElement('button', { className: "text-xs px-2 py-1 bg-green-100 text-green-800 rounded" },
                  "Connected"
                ) : 
                React.createElement('button', {
                  className: "text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200",
                  onClick: () => connectToSavedPrinter(printer)
                },
                  "Connect"
                ),
              
              React.createElement('button', {
                className: "text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200",
                onClick: () => removeSavedPrinter(printer)
              },
                "Remove"
              )
            )
          )
        )
      )
    ),

    // Connection Status Messages
    currentConnection && !currentConnection.success && currentConnection.error && 
      React.createElement('div', { className: "mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center" },
        React.createElement(AlertCircle, { className: "w-5 h-5 mr-2" }),
        currentConnection.error
      ),

    currentConnection && currentConnection.success && 
      React.createElement('div', { className: "mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center" },
        React.createElement(CheckCircle, { className: "w-5 h-5 mr-2" }),
        `Successfully connected to printer at ${currentConnection.connection.ipAddress}`
      )
  );
};

// EpsonIntegration Component
const EpsonIntegration = ({ processedReceipts }) => {
  const [activeTab, setActiveTab] = React.useState('connect');
  const [printerConnection, setPrinterConnection] = React.useState(null);
  const [selectedReceipt, setSelectedReceipt] = React.useState(null);
  const [printerStatus, setPrinterStatus] = React.useState(null);
  const [statusCheckInterval, setStatusCheckInterval] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Handle printer connection
  const handlePrinterConnect = async (ipAddress, port) => {
    try {
      setError(null);
      const connection = await window.EpsonPrinterService.connectToPrinter(ipAddress, port);
      setPrinterConnection(connection);
      
      // Set up periodic status checks
      if (connection.success) {
        const intervalId = setInterval(async () => {
          try {
            const status = await window.EpsonPrinterService.getPrinterStatus(connection.connection);
            setP
