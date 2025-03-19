/**
 * Mock Epson ePOS SDK
 * This file provides a mock implementation of the Epson ePOS SDK for development and testing purposes.
 * It simulates the behavior of the actual SDK without requiring a physical printer.
 */

console.log('Mock Epson ePOS SDK loaded successfully');

// Define the epson namespace if it doesn't exist
window.epson = window.epson || {};

// Define the ePOSDevice class
window.epson.ePOSDevice = class ePOSDevice {
  constructor() {
    this.printers = {};
    this.isConnected = false;
    this.connectionId = null;
    this.ipAddress = null;
    this.port = null;
  }

  /**
   * Connect to a printer
   * @param {string} ipAddress - IP address of the printer
   * @param {string} port - Port number
   * @param {function} callback - Callback function
   */
  connect(ipAddress, port, callback) {
    console.log(`[Mock ePOS] Connecting to printer at ${ipAddress}:${port}...`);
    
    // Simulate connection delay
    setTimeout(() => {
      // 90% success rate for simulation
      if (Math.random() > 0.1) {
        this.isConnected = true;
        this.connectionId = 'mock_connection_' + Math.random().toString(36).substring(2, 15);
        this.ipAddress = ipAddress;
        this.port = port;
        
        console.log(`[Mock ePOS] Successfully connected to printer at ${ipAddress}:${port}`);
        callback('OK');
      } else {
        console.error(`[Mock ePOS] Failed to connect to printer at ${ipAddress}:${port}`);
        callback('CONNECT_ERROR');
      }
    }, 1000);
  }

  /**
   * Disconnect from a printer
   */
  disconnect() {
    console.log('[Mock ePOS] Disconnecting from printer...');
    
    // Simulate disconnection delay
    setTimeout(() => {
      this.isConnected = false;
      this.connectionId = null;
      this.ipAddress = null;
      this.port = null;
      
      console.log('[Mock ePOS] Successfully disconnected from printer');
    }, 500);
  }

  /**
   * Create a printer object
   * @param {string} deviceId - Device ID
   * @param {string} deviceType - Device type
   * @param {function} callback - Callback function
   */
  createDevice(deviceId, deviceType, callback) {
    console.log(`[Mock ePOS] Creating device: ${deviceId}, type: ${deviceType}`);
    
    if (deviceType !== 'printer') {
      console.error(`[Mock ePOS] Unsupported device type: ${deviceType}`);
      callback(null, 'DEVICE_TYPE_ERROR');
      return;
    }
    
    // Create a mock printer object
    const printer = new MockEpsonPrinter(deviceId);
    this.printers[deviceId] = printer;
    
    console.log(`[Mock ePOS] Successfully created printer device: ${deviceId}`);
    callback(printer, 'OK');
  }
};

// Define the MockEpsonPrinter class
class MockEpsonPrinter {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.status = {
      online: true,
      paper: 'ok',
      cover: 'closed',
      drawer: 'closed',
      errors: []
    };
  }

  /**
   * Add text to the print buffer
   * @param {string} text - Text to print
   */
  addText(text) {
    console.log(`[Mock ePOS] Adding text to print buffer: ${text}`);
    return this;
  }

  /**
   * Add a new line to the print buffer
   */
  addNewLine() {
    console.log('[Mock ePOS] Adding new line to print buffer');
    return this;
  }

  /**
   * Add a feed line to the print buffer
   * @param {number} lines - Number of lines to feed
   */
  addFeedLine(lines) {
    console.log(`[Mock ePOS] Adding feed line to print buffer: ${lines} lines`);
    return this;
  }

  /**
   * Add a cut to the print buffer
   * @param {string} type - Cut type (full or partial)
   */
  addCut(type) {
    console.log(`[Mock ePOS] Adding cut to print buffer: ${type}`);
    return this;
  }

  /**
   * Add alignment to the print buffer
   * @param {string} alignment - Alignment (left, center, right)
   */
  addTextAlign(alignment) {
    console.log(`[Mock ePOS] Adding text alignment to print buffer: ${alignment}`);
    return this;
  }

  /**
   * Add text size to the print buffer
   * @param {number} width - Width multiplier
   * @param {number} height - Height multiplier
   */
  addTextSize(width, height) {
    console.log(`[Mock ePOS] Adding text size to print buffer: width=${width}, height=${height}`);
    return this;
  }

  /**
   * Add text style to the print buffer
   * @param {boolean} reverse - Reverse text
   * @param {boolean} underline - Underline text
   * @param {boolean} bold - Bold text
   * @param {boolean} italic - Italic text
   */
  addTextStyle(reverse, underline, bold, italic) {
    console.log(`[Mock ePOS] Adding text style to print buffer: reverse=${reverse}, underline=${underline}, bold=${bold}, italic=${italic}`);
    return this;
  }

  /**
   * Add a barcode to the print buffer
   * @param {string} data - Barcode data
   * @param {string} type - Barcode type
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
   * @param {string} hri - HRI position
   */
  addBarcode(data, type, width, height, hri) {
    console.log(`[Mock ePOS] Adding barcode to print buffer: data=${data}, type=${type}, width=${width}, height=${height}, hri=${hri}`);
    return this;
  }

  /**
   * Add a QR code to the print buffer
   * @param {string} data - QR code data
   * @param {number} level - Error correction level
   * @param {number} width - QR code width
   */
  addQRCode(data, level, width) {
    console.log(`[Mock ePOS] Adding QR code to print buffer: data=${data}, level=${level}, width=${width}`);
    return this;
  }

  /**
   * Add an image to the print buffer
   * @param {string} data - Image data
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  addImage(data, width, height) {
    console.log(`[Mock ePOS] Adding image to print buffer: width=${width}, height=${height}`);
    return this;
  }

  /**
   * Send the print buffer to the printer
   * @param {function} callback - Callback function
   */
  send(callback) {
    console.log('[Mock ePOS] Sending print buffer to printer...');
    
    // Simulate printing delay
    setTimeout(() => {
      // 95% success rate for simulation
      if (Math.random() > 0.05) {
        console.log('[Mock ePOS] Successfully sent print buffer to printer');
        callback('OK');
      } else {
        console.error('[Mock ePOS] Failed to send print buffer to printer');
        callback('SEND_ERROR');
      }
    }, 1500);
  }

  /**
   * Get the printer status
   * @param {function} callback - Callback function
   */
  getStatus(callback) {
    console.log('[Mock ePOS] Getting printer status...');
    
    // Simulate status check delay
    setTimeout(() => {
      // Randomly change paper status for simulation
      if (Math.random() < 0.1) {
        this.status.paper = 'low';
      } else {
        this.status.paper = 'ok';
      }
      
      console.log('[Mock ePOS] Successfully got printer status');
      callback(this.status);
    }, 500);
  }
}
