/**
 * Epson Printer Service
 * Handles communication with Epson printers using the ePOS SDK
 */

// Create a global namespace for the Epson Printer Service
window.EpsonPrinterService = {};

const EPSON_CONNECT_TIMEOUT = 10000; // 10 seconds

/**
 * Initialize the ePOS SDK and detect available printers
 * @returns {Promise<Object>} Initialization result
 */
window.EpsonPrinterService.initializeEpsonSDK = async function() {
  try {
    // Check if ePOS SDK is available (this would typically be loaded via a <script> tag)
    if (!window.epson || !window.epson.ePOSDevice) {
      throw new Error('Epson ePOS SDK not found. Make sure to include the Epson ePOS SDK in your project.');
    }

    console.log('Initializing Epson ePOS SDK...');
    return { success: true, message: 'Epson ePOS SDK initialized' };
  } catch (error) {
    console.error('Error initializing Epson ePOS SDK:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Connect to an Epson printer
 * @param {string} ipAddress - IP address of the printer
 * @param {string} port - Port number (default: 8008)
 * @returns {Promise<Object>} Connection result
 */
window.EpsonPrinterService.connectToPrinter = async function(ipAddress, port = '8008') {
  try {
    if (!ipAddress) {
      throw new Error('IP address is required');
    }

    console.log(`Connecting to Epson printer at ${ipAddress}:${port}...`);

    // Create a new ePOS device
    const epos = new window.epson.ePOSDevice();

    // Connect to the printer
    return new Promise((resolve, reject) => {
      // Set a timeout for the connection
      const timeoutId = setTimeout(() => {
        reject(new Error(`Connection timeout after ${EPSON_CONNECT_TIMEOUT / 1000} seconds`));
      }, EPSON_CONNECT_TIMEOUT);

      // Connect to the printer
      epos.connect(ipAddress, port, (connectResult) => {
        clearTimeout(timeoutId);

        if (connectResult === 'OK') {
          // Create a printer device
          epos.createDevice('local_printer', 'printer', (printer, deviceResult) => {
            if (deviceResult === 'OK') {
              resolve({
                success: true,
                connection: {
                  id: epos.connectionId,
                  ipAddress,
                  port,
                  deviceId: 'local_printer',
                  epos,
                  printer
                },
                message: `Successfully connected to printer at ${ipAddress}:${port}`
              });
            } else {
              epos.disconnect();
              reject(new Error(`Failed to create printer device: ${deviceResult}`));
            }
          });
        } else {
          reject(new Error(`Failed to connect to printer: ${connectResult}`));
        }
      });
    });
  } catch (error) {
    console.error('Error connecting to Epson printer:', error);
    throw error;
  }
}

/**
 * Disconnect from an Epson printer
 * @param {Object} connection - The printer connection object
 * @returns {Promise<Object>} Disconnection result
 */
window.EpsonPrinterService.disconnectPrinter = async function(connection) {
  try {
    if (!connection) {
      throw new Error('No active printer connection');
    }

    console.log(`Disconnecting from printer ${connection.deviceId}...`);

    // Disconnect from the printer
    connection.epos.disconnect();

    return {
      success: true,
      message: `Successfully disconnected from printer ${connection.deviceId}`
    };
  } catch (error) {
    console.error('Error disconnecting from Epson printer:', error);
    throw error;
  }
}

/**
 * Print a receipt with receipt data
 * @param {Object} connection - The printer connection object
 * @param {Object} receiptData - The receipt data to print
 * @returns {Promise<Object>} Print result
 */
window.EpsonPrinterService.printReceipt = async function(connection, receiptData) {
  try {
    if (!connection) {
      throw new Error('No active printer connection');
    }

    if (!receiptData) {
      throw new Error('Receipt data is required');
    }

    console.log(`Printing receipt to ${connection.deviceId}...`, receiptData);

    const printer = connection.printer;

    // Format the receipt for printing
    const formattedReceipt = window.EpsonPrinterService.formatReceiptForPrinter(receiptData);

    // Create the print job
    return new Promise((resolve, reject) => {
      try {
        // Add receipt content to the print buffer
        printer
          .addTextAlign('center')
          .addTextSize(2, 2)
          .addText('RECEIPT')
          .addTextSize(1, 1)
          .addFeedLine(1)
          .addText(`${formattedReceipt.formattedDate} ${formattedReceipt.formattedTime}`)
          .addFeedLine(1)
          .addTextAlign('left')
          .addText(`Customer: ${formattedReceipt.customer_name || 'N/A'}`)
          .addFeedLine(1)
          .addText(`Check #: ${formattedReceipt.check_number || 'N/A'}`)
          .addFeedLine(1);

        if (formattedReceipt.payment_type) {
          printer
            .addText(`Payment: ${formattedReceipt.payment_type}`)
            .addFeedLine(1);
        }

        printer
          .addFeedLine(1)
          .addText('--------------------------------')
          .addFeedLine(1)
          .addText(`Subtotal: ${formatCurrency(formattedReceipt.amount)}`)
          .addFeedLine(1)
          .addText(`Tip: ${formatCurrency(formattedReceipt.tip)}`)
          .addFeedLine(1)
          .addText('--------------------------------')
          .addFeedLine(1)
          .addTextStyle(false, false, true, false)
          .addText(`Total: ${formatCurrency(formattedReceipt.total)}`)
          .addTextStyle(false, false, false, false)
          .addFeedLine(2)
          .addTextAlign('center')
          .addText(formattedReceipt.signed ? 'Signature on file' : 'Signature not required')
          .addFeedLine(3)
          .addCut('partial');

        // Send the print job to the printer
        printer.send((printResult) => {
          if (printResult === 'OK') {
            resolve({
              success: true,
              jobId: generateJobId(),
              message: 'Receipt sent to printer successfully'
            });
          } else {
            reject(new Error(`Failed to print receipt: ${printResult}`));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw error;
  }
}

/**
 * Print a batch of receipts
 * @param {Object} connection - The printer connection object
 * @param {Array} receipts - Array of receipt data objects
 * @returns {Promise<Object>} Print results
 */
window.EpsonPrinterService.printBatchReceipts = async function(connection, receipts) {
  try {
    if (!connection) {
      throw new Error('No active printer connection');
    }

    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      throw new Error('Valid receipt data array is required');
    }

    console.log(`Printing ${receipts.length} receipts to ${connection.deviceId}...`);

    // Process each receipt
    const results = [];
    
    for (let i = 0; i < receipts.length; i++) {
      try {
        // Print the receipt
        const result = await window.EpsonPrinterService.printReceipt(connection, receipts[i]);
        
        results.push({
          index: i,
          receipt: receipts[i],
          success: true,
          jobId: result.jobId
        });
      } catch (error) {
        results.push({
          index: i,
          receipt: receipts[i],
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      totalReceipts: receipts.length,
      successfulPrints: results.filter(r => r.success).length,
      failedPrints: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    console.error('Error printing batch receipts:', error);
    throw error;
  }
}

/**
 * Format receipt data for Epson printer
 * @param {Object} receiptData - Raw receipt data
 * @returns {Object} Formatted receipt data
 */
window.EpsonPrinterService.formatReceiptForPrinter = function(receiptData) {
  try {
    // Create a deep copy to avoid modifying the original data
    const formattedReceipt = JSON.parse(JSON.stringify(receiptData));
    
    // Add print-specific formatting
    return {
      ...formattedReceipt,
      formattedDate: formatDate(formattedReceipt.date),
      formattedTime: formatTime(formattedReceipt.time),
      printTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error formatting receipt for printer:', error);
    throw error;
  }
}

/**
 * Generate a test receipt
 * @returns {Object} Test receipt data
 */
window.EpsonPrinterService.generateTestReceipt = function() {
  const now = new Date();
  const testReceipt = {
    customer_name: "Test Customer",
    check_number: "T" + Math.floor(Math.random() * 100000),
    date: `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
    time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    amount: "$25.00",
    payment_type: "Credit Card",
    tip: "$5.00",
    total: "$30.00",
    signed: true
  };
  
  return testReceipt;
}

/**
 * Check printer status
 * @param {Object} connection - The printer connection object
 * @returns {Promise<Object>} Printer status
 */
window.EpsonPrinterService.getPrinterStatus = async function(connection) {
  try {
    if (!connection) {
      throw new Error('No active printer connection');
    }

    console.log(`Getting status for printer ${connection.deviceId}...`);

    const printer = connection.printer;

    // Get the printer status
    return new Promise((resolve, reject) => {
      printer.getStatus((status) => {
        resolve({
          success: true,
          status
        });
      });
    });
  } catch (error) {
    console.error('Error checking printer status:', error);
    throw error;
  }
}

// Helper functions

function generateJobId() {
  return 'job_' + Math.random().toString(36).substring(2, 10);
}

function formatCurrency(value) {
  if (!value) return '$0.00';
  
  // Remove any existing $ sign and convert to number
  const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return dateStr;
    
    // Check if it's MM/DD/YYYY or YYYY-MM-DD format
    if (dateStr.includes('/')) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    } else {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  } catch (error) {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  
  try {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return timeStr;
    
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${hours}:${minutes} ${ampm}`;
  } catch (error) {
    return timeStr;
  }
}
