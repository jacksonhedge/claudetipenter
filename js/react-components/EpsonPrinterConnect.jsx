import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const EpsonPrinterConnect = ({ onConnect, onDisconnect, currentConnection, printerStatus }) => {
  const [printerIP, setPrinterIP] = useState('');
  const [printerPort, setPrinterPort] = useState('8008');
  const [isConnecting, setIsConnecting] = useState(false);
  const [savedPrinters, setSavedPrinters] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved printers from localStorage on component mount
  useEffect(() => {
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Printer className="w-6 h-6 mr-2" />
          Epson Printer Connection
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md flex items-center"
        >
          <Settings className="w-4 h-4 mr-1" />
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>

      {!showSettings ? (
        <div className="mb-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isPrinterConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>
              {isPrinterConnected
                ? `Connected to ${currentConnection.connection.ipAddress}`
                : 'No printer connected'}
            </span>
          </div>

          {isPrinterConnected && printerStatus && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                <div className="flex justify-between">
                  <span className="font-medium">Online:</span>
                  <span>{printerStatus.status.online ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Paper:</span>
                  <span>{printerStatus.status.paper === 'ok' ? 'OK' : 'Low'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cover:</span>
                  <span>{printerStatus.status.cover}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Drawer:</span>
                  <span>{printerStatus.status.drawer}</span>
                </div>
              </div>

              <button
                onClick={() => onConnect(currentConnection.connection.ipAddress, currentConnection.connection.port)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Status
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md mb-4 animate-fadeIn">
          <h3 className="font-semibold mb-2">Printer Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Printer IP Address
              </label>
              <input
                type="text"
                value={printerIP}
                onChange={(e) => setPrinterIP(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isPrinterConnected}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="text"
                value={printerPort}
                onChange={(e) => setPrinterPort(e.target.value)}
                placeholder="8008"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isPrinterConnected}
              />
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {!isPrinterConnected ? (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-blue-300"
                disabled={isConnecting || !printerIP}
                onClick={handleConnect}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
                  onClick={() => {
                    // This would be implemented in the parent component
                    // and passed down as a prop if needed
                    alert('Test print functionality would be triggered here');
                  }}
                >
                  Test Print
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {savedPrinters.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-sm text-gray-700">Saved Printers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {savedPrinters.map((printer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{printer.name || 'Unnamed Printer'}</span>
                  <span className="text-xs text-gray-500">{`${printer.ip}:${printer.port || '8008'}`}</span>
                </div>
                
                <div className="flex gap-2">
                  {isPrinterConnected && currentConnection.connection.ipAddress === printer.ip ? (
                    <button className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                      Connected
                    </button>
                  ) : (
                    <button
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      onClick={() => connectToSavedPrinter(printer)}
                    >
                      Connect
                    </button>
                  )}
                  
                  <button
                    className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    onClick={() => removeSavedPrinter(printer)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentConnection && !currentConnection.success && currentConnection.error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {currentConnection.error}
        </div>
      )}

      {currentConnection && currentConnection.success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Successfully connected to printer at {currentConnection.connection.ipAddress}
        </div>
      )}
    </div>
  );
};

export default EpsonPrinterConnect;
