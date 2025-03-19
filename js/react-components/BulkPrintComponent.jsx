import React, { useState, useEffect } from 'react';
import { Printer, ChevronUp, ChevronDown, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const BulkPrintComponent = ({ receipts, printerConnection, onPrintBatch }) => {
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResults, setPrintResults] = useState(null);
  const [expandedReceipt, setExpandedReceipt] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  // Update selected receipts when receipts prop changes
  useEffect(() => {
    setSelectedReceipts([]);
    setSelectAll(false);
  }, [receipts]);

  // Handle select all checkbox
  useEffect(() => {
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-800">Bulk Print Receipts</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-600">
            {isPrinterConnected ? 'Printer Connected' : 'Printer Not Connected'}
          </span>
        </div>
      </div>

      {receipts.length > 0 ? (
        <>
          <div className="flex items-center mb-3 p-2 bg-gray-50 rounded-md">
            <input
              type="checkbox"
              id="select-all"
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
              className="mr-2"
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All Receipts
            </label>
            
            <button
              onClick={handlePrintSelected}
              disabled={selectedReceipts.length === 0 || !isPrinterConnected || isPrinting}
              className={`ml-auto flex items-center gap-2 py-1 px-3 rounded-md ${
                selectedReceipts.length === 0 || !isPrinterConnected || isPrinting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isPrinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Print Selected ({selectedReceipts.length})
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {receipts.map((receipt, index) => {
              const isSelected = selectedReceipts.includes(index);
              const isExpanded = expandedReceipt === index;
              
              return (
                <div
                  key={index}
                  className={`border rounded-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div
                    className="flex items-center p-3 cursor-pointer"
                    onClick={() => toggleReceiptSelection(index)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleReceiptSelection(index)}
                      className="mr-3"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1">
                      <div className="font-medium">
                        Receipt #{receipt.check_number || index + 1}
                      </div>
                      <div className="text-sm text-gray-600">
                        {receipt.customer_name || 'Unknown'} - {receipt.date || 'No date'} - {formatCurrency(receipt.total)}
                      </div>
                    </div>
                    
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandReceipt(index);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-gray-200 bg-gray-50">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Customer</td>
                            <td className="py-1 text-right">{receipt.customer_name || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Check #</td>
                            <td className="py-1 text-right">{receipt.check_number || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Date</td>
                            <td className="py-1 text-right">{receipt.date || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Time</td>
                            <td className="py-1 text-right">{receipt.time || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Payment</td>
                            <td className="py-1 text-right">{receipt.payment_type || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Subtotal</td>
                            <td className="py-1 text-right">{formatCurrency(receipt.amount)}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Tip</td>
                            <td className="py-1 text-right">{formatCurrency(receipt.tip)}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1 font-medium">Total</td>
                            <td className="py-1 text-right">{formatCurrency(receipt.total)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Signed</td>
                            <td className="py-1 text-right">{receipt.signed ? 'Yes' : 'No'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {printResults && (
            <div
              className={`mt-4 p-3 rounded-md ${
                printResults.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {printResults.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {printResults.success ? 'Print job completed' : 'Print job failed'}
                </span>
              </div>
              
              {printResults.success ? (
                <div className="text-sm">
                  Successfully printed {printResults.totalPrinted} of {printResults.totalPrinted + printResults.totalFailed} receipts.
                  {printResults.totalFailed > 0 && (
                    <div>Failed to print {printResults.totalFailed} receipts.</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  {printResults.message || 'Unknown error occurred during printing.'}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center text-gray-500 border border-gray-200 rounded-md">
          No receipts available for printing.
        </div>
      )}

      {!isPrinterConnected && (
        <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          Connect to a printer first to enable printing
        </div>
      )}
    </div>
  );
};

export default BulkPrintComponent;
