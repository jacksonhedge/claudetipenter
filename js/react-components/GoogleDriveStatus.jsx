import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const GoogleDriveStatus = () => {
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [newFileCount, setNewFileCount] = useState(0);
  
  // Mock function - in production, this would call your backend API
  const checkGoogleDriveStatus = async () => {
    setScanStatus('scanning');
    
    try {
      // This would be an API call to your backend
      const response = await fetch('/api/google-drive/status');
      const data = await response.json();
      
      setLastScanTime(new Date());
      setNewFileCount(data.newFileCount || 0);
      setScanStatus('success');
    } catch (error) {
      console.error('Error checking Google Drive status:', error);
      setScanStatus('error');
    }
  };
  
  // Check status on component mount
  useEffect(() => {
    checkGoogleDriveStatus();
    
    // Set up interval to check periodically
    const interval = setInterval(checkGoogleDriveStatus, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Scanner Status (Google Drive)</h3>
        <button 
          onClick={checkGoogleDriveStatus}
          className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
          disabled={scanStatus === 'scanning'}
        >
          <RefreshCw className={`w-5 h-5 ${scanStatus === 'scanning' ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex items-center mt-2">
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
          scanStatus === 'error' ? 'bg-red-500' : 
          scanStatus === 'success' ? 'bg-green-500' : 
          'bg-gray-500'
        }`}></span>
        <span className="text-sm text-gray-600">
          {scanStatus === 'error' ? 'Error connecting to Google Drive' :
           scanStatus === 'scanning' ? 'Checking for new scans...' :
           scanStatus === 'success' ? 'Connected to Google Drive' :
           'Idle'}
        </span>
      </div>
      
      {lastScanTime && (
        <div className="text-xs text-gray-500 mt-1">
          Last checked: {lastScanTime.toLocaleTimeString()}
        </div>
      )}
      
      {newFileCount > 0 && (
        <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-md flex items-center text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          {newFileCount} new scanned {newFileCount === 1 ? 'receipt' : 'receipts'} found
        </div>
      )}
    </div>
  );
};

export default GoogleDriveStatus;
