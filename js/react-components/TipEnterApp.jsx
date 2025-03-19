import React, { useState, useEffect } from 'react';
import EpsonIntegration from './EpsonIntegration';
import { Printer, AlertCircle, CheckCircle, X } from 'lucide-react';
import { initializeEpsonSDK } from '../services/epsonPrinterService';

const TipEnterApp = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [processedReceipts, setProcessedReceipts] = useState([]);
  const [showPrinterPanel, setShowPrinterPanel] = useState(false);
  const [epsonSDKStatus, setEpsonSDKStatus] = useState(null);
  const [notification, setNotification] = useState(null);

  // Initialize Epson SDK on component mount
  useEffect(() => {
    const loadEpsonSDK = async () => {
      try {
        const result = await initializeEpsonSDK();
        setEpsonSDKStatus(result);
        
        if (!result.success) {
          showNotification({
            type: 'error',
            message: 'Failed to initialize Epson SDK: ' + result.error
          });
        }
      } catch (error) {
        console.error('Error initializing Epson SDK:', error);
        setEpsonSDKStatus({ success: false, error: error.message });
        
        showNotification({
          type: 'error',
          message: 'Failed to initialize Epson SDK: ' + error.message
        });
      }
    };
    
    loadEpsonSDK();
  }, []);

  // Monitor for processed receipts from the main application
  useEffect(() => {
    // This is where you would integrate with your existing app's state
    // For this example, we'll use a mock function to simulate getting processed receipts
    
    const checkForProcessedReceipts = () => {
      // In a real implementation, this would check your app's state
      const existingData = window.localStorage.getItem('processedReceipts');
      
      if (existingData) {
        try {
          const parsedData = JSON.parse(existingData);
          if (parsedData && parsedData.results && Array.isArray(parsedData.results)) {
            setProcessedReceipts(parsedData.results);
            return;
          }
        } catch (e) {
          console.error('Error parsing processed receipts:', e);
        }
      }
      
      // If no data or error parsing, load sample data
      loadSampleReceiptData();
    };
    
    checkForProcessedReceipts();
    
    // Set up interval to check for new receipt data (in real app would use events/state)
    const interval = setInterval(checkForProcessedReceipts, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Load sample receipt data for demonstration
  const loadSampleReceiptData = () => {
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
    
    setProcessedReceipts(sampleData.results);
    // Save to localStorage to simulate persistent state
    window.localStorage.setItem('processedReceipts', JSON.stringify(sampleData));
  };

  // Show notification
  const showNotification = (notif) => {
    setNotification(notif);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Dismiss notification
  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TipEnter</h1>
          <p className="text-gray-600">Receipt Processing and Organization</p>
        </div>
        
        <button
          onClick={() => setShowPrinterPanel(!showPrinterPanel)}
          className={`flex items-center px-4 py-2 rounded ${
            showPrinterPanel 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <Printer className="mr-2 h-5 w-5" />
          {showPrinterPanel ? 'Hide Printer Panel' : 'Show Printer Panel'}
        </button>
      </header>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-md p-4 rounded-md shadow-lg z-50 flex items-start ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-50 border border-red-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Printer className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' : 
              notification.type === 'error' ? 'text-red-800' : 
              'text-blue-800'
            }`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={dismissNotification}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs - These would integrate with your existing app */}
      <nav className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scanner'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tip Analyzer
          </button>
          <button
            onClick={() => setActiveTab('organized')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'organized'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Organized Images
          </button>
          <button
            onClick={() => setActiveTab('file-organizer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'file-organizer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            File Organizer
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-col space-y-6">
        {/* Epson Printer Panel (Collapsible) */}
        {showPrinterPanel && (
          <div className="transition-all duration-300 ease-in-out">
            <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center">
                  <Printer className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-blue-800">Epson Printer Integration</h2>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    epsonSDKStatus && epsonSDKStatus.success 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm text-gray-600">
                    {epsonSDKStatus && epsonSDKStatus.success 
                      ? 'SDK Ready' 
                      : 'SDK Not Available'}
                  </span>
                </div>
              </div>
              
              <EpsonIntegration processedReceipts={processedReceipts} />
            </div>
          </div>
        )}

        {/* Main Application Content */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          {/* This is where your existing app main content would be rendered */}
          {/* For this example, we'll just show a placeholder */}
          
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {activeTab === 'scanner' 
                ? 'Tip Analyzer Tab Content' 
                : activeTab === 'organized'
                  ? 'Organized Images Tab Content'
                  : 'File Organizer Tab Content'}
            </h2>
            <p className="text-gray-500 mb-6">
              This is a placeholder for your existing application content. <br />
              The Epson printer integration panel above provides printing functionality.
            </p>
            
            {processedReceipts.length > 0 && (
              <div className="mt-4 text-left max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Processed Receipts Summary:</h3>
                <ul className="list-disc pl-5 text-gray-600">
                  <li>Total receipts: {processedReceipts.length}</li>
                  <li>Total sales amount: ${processedReceipts.reduce((sum, receipt) => {
                    const amount = parseFloat(String(receipt.amount).replace(/[^\d.-]/g, '') || 0);
                    return sum + amount;
                  }, 0).toFixed(2)}</li>
                  <li>Total tips: ${processedReceipts.reduce((sum, receipt) => {
                    const tip = parseFloat(String(receipt.tip).replace(/[^\d.-]/g, '') || 0);
                    return sum + tip;
                  }, 0).toFixed(2)}</li>
                </ul>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      // Show printer panel first if not already shown
                      if (!showPrinterPanel) {
                        setShowPrinterPanel(true);
                      }
                      
                      // Use setTimeout to ensure the panel is rendered before trying to click the tab
                      setTimeout(() => {
                        const batchTabButton = document.querySelector('button[data-tab="batch"]');
                        if (batchTabButton) {
                          batchTabButton.click();
                        } else {
                          console.error("Batch tab button not found");
                        }
                      }, 300); // Increased timeout to ensure DOM is updated
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Print All Receipts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipEnterApp;
