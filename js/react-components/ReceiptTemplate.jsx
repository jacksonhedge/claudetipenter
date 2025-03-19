import React, { useState } from 'react';
import { Printer, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ReceiptTemplate = ({ receiptData, onPrint, printerConnection }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResult, setPrintResult] = useState(null);
  
  // Format currency values for display
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    
    // Remove any existing $ sign and convert to number
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? '$0.00' : `$${numericValue.toFixed(2)}`;
  };

  const handlePrint = async () => {
    if (!receiptData) return;
    
    setIsPrinting(true);
    setPrintResult(null);
    
    try {
      // Call the onPrint callback which should handle the printing logic
      const result = await onPrint(receiptData);
      setPrintResult({ success: true, message: 'Receipt printed successfully!' });
    } catch (error) {
      console.error('Error printing receipt:', error);
      setPrintResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setIsPrinting(false);
    }
  };

  // Check if printer is connected
  const isPrinterConnected = printerConnection && printerConnection.success;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-800">Receipt Preview</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-600">
            {isPrinterConnected ? 'Printer Connected' : 'Printer Not Connected'}
          </span>
        </div>
      </div>

      {receiptData ? (
        <div className="border border-gray-200 rounded-md p-4 mb-4 font-mono text-sm bg-gray-50">
          <div className="text-center mb-3">
            <div className="font-bold text-lg mb-1">RECEIPT</div>
            <div>{receiptData.date} {receiptData.time}</div>
          </div>
          
          <div className="mb-3">
            <div><span className="font-semibold">Customer:</span> {receiptData.customer_name || 'N/A'}</div>
            <div><span className="font-semibold">Check #:</span> {receiptData.check_number || 'N/A'}</div>
            {receiptData.payment_type && (
              <div><span className="font-semibold">Payment:</span> {receiptData.payment_type}</div>
            )}
          </div>
          
          <div className="border-t border-b border-gray-300 py-2 my-2">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal:</span>
              <span>{formatCurrency(receiptData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Tip:</span>
              <span>{formatCurrency(receiptData.tip)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300">
              <span>Total:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
          </div>
          
          <div className="text-center mt-3 text-xs">
            {receiptData.signed ? 'Signature on file' : 'Signature not required'}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md p-6 mb-4 text-center text-gray-500">
          No receipt data available for preview
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <button
          onClick={handlePrint}
          disabled={!receiptData || !isPrinterConnected || isPrinting}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
            !receiptData || !isPrinterConnected 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isPrinting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="w-5 h-5" />
              Print Receipt
            </>
          )}
        </button>

        {printResult && (
          <div className={`mt-2 p-2 rounded-md flex items-center gap-2 ${
            printResult.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {printResult.success 
              ? <CheckCircle className="w-5 h-5" /> 
              : <AlertCircle className="w-5 h-5" />}
            <span>{printResult.message}</span>
          </div>
        )}

        {!isPrinterConnected && (
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
            Connect to a printer first to enable printing
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptTemplate;
