import React, { useState, useEffect } from 'react';
import EpsonPrinterConnect from './EpsonPrinterConnect';
import ReceiptTemplate from './ReceiptTemplate';
import BulkPrintComponent from './BulkPrintComponent';
import { Printer, Layers, Settings, AlertCircle } from 'lucide-react';
import {
  connectToPrinter,
  disconnectPrinter,
  printReceipt,
  printBatchReceipts,
  formatReceiptForPrinter,
  getPrinterStatus,
  generateTestReceipt
} from '../services/epsonPrinterService';

const EpsonIntegration = ({ processedReceipts }) => {
  const [activeTab, setActiveTab] = useState('connect');
  const [printerConnection, setPrinterConnection] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [error, setError] = useState(null);

  // Handle printer connection
  const handlePrinterConnect = async (ipAddress, port) => {
    try {
      setError(null);
      const connection = await connectToPrinter(ipAddress, port);
      setPrinterConnection(connection);
      
      // Set up periodic status checks
      if (connection.success) {
        const intervalId = setInterval(async () => {
          try {
            const status = await getPrinterStatus(connection.connection);
            setPrinterStatus(status);
          } catch (err) {
            console.error('Error checking printer status:', err);
            // If we can't get status, consider the printer disconnected
            if (err.message.includes('connection') || err.message.includes('offline')) {
              clearInterval(intervalId);
              setPrinterConnection(null);
              setPrinterStatus(null);
              setError('Printer connection lost. Please reconnect.');
            }
          }
        }, 30000); // Check every 30 seconds
        
        setStatusCheckInterval(intervalId);
        
        // Get initial status
        const initialStatus = await getPrinterStatus(connection.connection);
        setPrinterStatus(initialStatus);
      }
      
      return connection;
    } catch (err) {
      console.error('Error connecting to printer:', err);
      setError(`Failed to connect to printer: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  // Handle printer disconnection
  const handlePrinterDisconnect = async () => {
    try {
      if (printerConnection && printerConnection.success) {
        await disconnectPrinter(printerConnection.connection);
      }
      
      // Clear status check interval
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
      
      setPrinterConnection(null);
      setPrinterStatus(null);
      setError(null);
    } catch (err) {
      console.error('Error disconnecting printer:', err);
      setError(`Failed to disconnect printer: ${err.message}`);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Handle printing a single receipt
  const handlePrintReceipt = async (receiptData) => {
    try {
      if (!printerConnection || !printerConnection.success) {
        throw new Error('No active printer connection');
      }
      
      // Format receipt for printing
      const formattedReceipt = formatReceiptForPrinter(receiptData);
      
      // Send to printer
      const result = await printReceipt(printerConnection.connection, formattedReceipt);
      return result;
    } catch (err) {
      console.error('Error printing receipt:', err);
      throw err;
    }
  };

  // Handle printing batch receipts
  const handlePrintBatchReceipts = async (receipts) => {
    try {
      if (!printerConnection || !printerConnection.success) {
        throw new Error('No active printer connection');
      }
      
      // Format receipts for printing
      const formattedReceipts = receipts.map(receipt => formatReceiptForPrinter(receipt));
      
      // Send to printer
      const result = await printBatchReceipts(printerConnection.connection, formattedReceipts);
      return result;
    } catch (err) {
      console.error('Error printing batch receipts:', err);
      throw err;
    }
  };

  // Generate a test receipt when no receipt is selected
  const handleGenerateTestReceipt = () => {
    setSelectedReceipt(generateTestReceipt());
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            data-tab="connect"
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'connect' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Printer className="w-5 h-5 mr-2" />
              Printer Setup
            </div>
          </button>
          <button
            data-tab="single"
            onClick={() => setActiveTab('single')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'single' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Printer className="w-5 h-5 mr-2" />
              Print Receipt
            </div>
          </button>
          <button
            data-tab="batch"
            onClick={() => setActiveTab('batch')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'batch' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Batch Printing
            </div>
          </button>
          <button
            data-tab="settings"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === 'settings' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Advanced Settings
            </div>
          </button>
        </nav>
      </div>

      {error && (
        <div className="mx-4 my-2 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="p-4">
        {activeTab === 'connect' && (
          <EpsonPrinterConnect 
            onConnect={handlePrinterConnect}
            onDisconnect={handlePrinterDisconnect}
            currentConnection={printerConnection}
            printerStatus={printerStatus}
          />
        )}

        {activeTab === 'single' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Print Single Receipt</h3>
              {processedReceipts && processedReceipts.length > 0 && (
                <div className="relative">
                  <select
                    className="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm"
                    value={selectedReceipt ? processedReceipts.findIndex(r => 
                      r.check_number === selectedReceipt.check_number && 
                      r.customer_name === selectedReceipt.customer_name
                    ) : -1}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      setSelectedReceipt(index >= 0 ? processedReceipts[index] : null);
                    }}
                  >
                    <option value="-1">Select a receipt...</option>
                    {processedReceipts.map((receipt, index) => (
                      <option key={index} value={index}>
                        {receipt.customer_name} - Check #{receipt.check_number}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {!selectedReceipt && (
              <div className="text-center p-8 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-500 mb-4">No receipt selected for printing</p>
                <button
                  onClick={handleGenerateTestReceipt}
                  className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Generate Test Receipt
                </button>
              </div>
            )}

            {selectedReceipt && (
              <ReceiptTemplate
                receiptData={selectedReceipt}
                onPrint={handlePrintReceipt}
                printerConnection={printerConnection}
              />
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <BulkPrintComponent
            receipts={processedReceipts || []}
            printerConnection={printerConnection}
            onPrintBatch={handlePrintBatchReceipts}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Printer Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Paper Settings</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Paper Width</label>
                      <select className="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                        <option value="58">58mm (2.28")</option>
                        <option value="80" selected>80mm (3.15")</option>
                        <option value="112">112mm (4.41")</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Cut Type</label>
                      <select className="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                        <option value="full">Full Cut</option>
                        <option value="partial" selected>Partial Cut</option>
                        <option value="none">No Cut</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Print Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="logo" className="mr-2" checked />
                      <label htmlFor="logo" className="text-sm text-gray-600">Print Logo</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="barcode" className="mr-2" />
                      <label htmlFor="barcode" className="text-sm text-gray-600">Print Barcode</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="qrcode" className="mr-2" />
                      <label htmlFor="qrcode" className="text-sm text-gray-600">Print QR Code</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="duplicate" className="mr-2" />
                      <label htmlFor="duplicate" className="text-sm text-gray-600">Print Duplicate Copy</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-gray-700">Advanced Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Character Encoding</label>
                    <select className="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                      <option value="utf8" selected>UTF-8</option>
                      <option value="ascii">ASCII</option>
                      <option value="windows1252">Windows-1252</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Print Density</label>
                    <select className="block w-full border border-gray-300 rounded-md py-1 px-3 text-sm">
                      <option value="low">Low</option>
                      <option value="medium" selected>Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2">
                  Reset to Defaults
                </button>
                <button className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpsonIntegration;
