/**
 * Epson Printer Connect Component
 * Provides functionality to connect to Epson printers
 */
import { createElement, showNotification } from '../utils/uiUtils.js';
import { 
    initializeEpsonSDK, 
    connectToPrinter, 
    disconnectPrinter, 
    printReceipt, 
    generateTestReceipt,
    getPrinterStatus
} from '../services/epsonPrinterService.js';

export default class EpsonPrinterConnect {
    /**
     * Initialize the Epson Printer Connect component
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - ID of the container element
     */
    constructor(options) {
        this.options = options;
        this.container = document.getElementById(options.containerId);
        
        // State for printer connection
        this.isPrinterConnected = false;
        this.printerIP = '';
        this.printerPort = '8008';
        this.isConnecting = false;
        this.connectionError = '';
        this.savedPrinters = [];
        this.showSettings = false;
        this.printerConnection = null; // Store the active printer connection object
        this.printerStatus = null; // Store the printer status
        
        // Bind methods
        this.render = this.render.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.connectToPrinter = this.connectToPrinter.bind(this);
        this.disconnectPrinter = this.disconnectPrinter.bind(this);
        this.connectToSavedPrinter = this.connectToSavedPrinter.bind(this);
        this.removeSavedPrinter = this.removeSavedPrinter.bind(this);
        this.testPrint = this.testPrint.bind(this);
        this.handleIPChange = this.handleIPChange.bind(this);
        this.handlePortChange = this.handlePortChange.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        if (!this.container) {
            console.error('Epson Printer Connect container not found');
            return;
        }
        
        // Load saved printers from localStorage
        const savedPrintersData = localStorage.getItem('epsonPrinters');
        if (savedPrintersData) {
            try {
                this.savedPrinters = JSON.parse(savedPrintersData);
            } catch (e) {
                console.error('Error loading saved printers:', e);
            }
        }
        
        // Initialize Epson SDK
        initializeEpsonSDK()
            .then(result => {
                if (!result.success) {
                    console.warn('Epson SDK initialization failed:', result.error);
                    this.connectionError = 'Epson SDK initialization failed: ' + result.error;
                } else {
                    console.log('Epson SDK initialized successfully');
                }
                this.render();
            })
            .catch(error => {
                console.error('Error initializing Epson SDK:', error);
                this.connectionError = 'Error initializing Epson SDK: ' + error.message;
                this.render();
            });
    }
    
    /**
     * Save printers to localStorage
     */
    savePrinters() {
        if (this.savedPrinters.length > 0) {
            localStorage.setItem('epsonPrinters', JSON.stringify(this.savedPrinters));
        }
    }
    
    /**
     * Handle IP address input change
     * @param {Event} e - The input event
     */
    handleIPChange(e) {
        this.printerIP = e.target.value;
        this.render();
    }
    
    /**
     * Handle port input change
     * @param {Event} e - The input event
     */
    handlePortChange(e) {
        this.printerPort = e.target.value;
        this.render();
    }
    
    /**
     * Toggle settings visibility
     */
    toggleSettings() {
        this.showSettings = !this.showSettings;
        this.render();
    }
    
    /**
     * Connect to Epson printer
     */
    async connectToPrinter() {
        if (!this.printerIP) {
            this.connectionError = 'Please enter a printer IP address';
            this.render();
            return;
        }
        
        this.isConnecting = true;
        this.connectionError = '';
        this.render();
        
        try {
            // Connect to printer using the printer service
            const result = await connectToPrinter(this.printerIP, this.printerPort);
            
            if (result.success) {
                // Store the connection object
                this.printerConnection = result.connection;
                
                // Add to saved printers if not already in the list
                if (!this.savedPrinters.some(printer => printer.ip === this.printerIP)) {
                    this.savedPrinters.push({ 
                        ip: this.printerIP, 
                        port: this.printerPort,
                        name: `Epson Printer (${this.printerIP})` 
                    });
                    
                    // Save to localStorage
                    this.savePrinters();
                }
                
                this.isPrinterConnected = true;
                this.connectionError = '';
                
                // Get printer status
                this.updatePrinterStatus();
                
                // Dispatch printer connected event
                const connectedEvent = new CustomEvent('printerConnected', {
                    detail: { connection: this.printerConnection }
                });
                document.dispatchEvent(connectedEvent);
                
                showNotification(result.message, 'success');
            } else {
                throw new Error(result.error || 'Unknown connection error');
            }
        } catch (error) {
            console.error('Printer connection error:', error);
            this.connectionError = 'Failed to connect to printer: ' + error.message;
            this.isPrinterConnected = false;
            this.printerConnection = null;
            showNotification('Failed to connect to printer', 'error');
        } finally {
            this.isConnecting = false;
            this.render();
        }
    }
    
    /**
     * Disconnect printer
     */
    async disconnectPrinter() {
        if (!this.printerConnection) {
            this.isPrinterConnected = false;
            this.render();
            return;
        }
        
        try {
            const result = await disconnectPrinter(this.printerConnection);
            
            if (result.success) {
                this.isPrinterConnected = false;
                this.printerConnection = null;
                this.printerStatus = null;
                
                // Dispatch printer disconnected event
                const disconnectedEvent = new CustomEvent('printerDisconnected');
                document.dispatchEvent(disconnectedEvent);
                
                showNotification(result.message, 'info');
            } else {
                throw new Error(result.error || 'Unknown disconnection error');
            }
        } catch (error) {
            console.error('Printer disconnection error:', error);
            // Force disconnect even if there was an error
            this.isPrinterConnected = false;
            this.printerConnection = null;
            this.printerStatus = null;
            showNotification('Printer disconnected with errors', 'warning');
        }
        
        this.render();
    }
    
    /**
     * Connect to a saved printer
     * @param {Object} printer - The printer to connect to
     */
    connectToSavedPrinter(printer) {
        this.printerIP = printer.ip;
        this.printerPort = printer.port || '8008';
        this.connectToPrinter();
    }
    
    /**
     * Remove a saved printer
     * @param {Object} printerToRemove - The printer to remove
     */
    removeSavedPrinter(printerToRemove) {
        this.savedPrinters = this.savedPrinters.filter(printer => printer.ip !== printerToRemove.ip);
        
        // Save to localStorage
        this.savePrinters();
        
        showNotification('Printer removed from saved list', 'info');
        this.render();
    }
    
    /**
     * Update printer status
     */
    async updatePrinterStatus() {
        if (!this.printerConnection) return;
        
        try {
            const result = await getPrinterStatus(this.printerConnection);
            
            if (result.success) {
                this.printerStatus = result.status;
            } else {
                console.warn('Failed to get printer status:', result.error);
            }
        } catch (error) {
            console.error('Error getting printer status:', error);
        }
        
        this.render();
    }
    
    /**
     * Test print a receipt
     */
    async testPrint() {
        if (!this.isPrinterConnected || !this.printerConnection) {
            showNotification('No active printer connection', 'error');
            return;
        }
        
        try {
            // Generate a test receipt
            const testReceipt = generateTestReceipt();
            
            showNotification(`Sending test print to printer at ${this.printerIP}`, 'info');
            
            // Print the receipt
            const result = await printReceipt(this.printerConnection, testReceipt);
            
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                throw new Error(result.error || 'Unknown printing error');
            }
        } catch (error) {
            console.error('Error printing test receipt:', error);
            showNotification('Failed to print test receipt: ' + error.message, 'error');
        }
    }
    
    /**
     * Render the component
     */
    render() {
        if (!this.container) return;
        
        // Clear container
        this.container.innerHTML = '';
        
        // Create component wrapper
        const wrapper = createElement('div', { className: 'bg-white p-6 rounded-lg shadow-md' });
        
        // Create header
        const header = createElement('div', { className: 'flex justify-between items-center mb-4' });
        
        // Create title
        const title = createElement('h2', { className: 'text-xl font-bold text-gray-800 flex items-center' });
        
        // Create printer icon
        const printerIcon = createElement('div', { 
            className: 'mr-2',
            innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>'
        });
        
        title.appendChild(printerIcon);
        title.appendChild(document.createTextNode('Epson Printer Connection'));
        
        // Create settings button
        const settingsButton = createElement('button', { 
            className: 'text-gray-500 hover:text-gray-700',
            onClick: this.toggleSettings,
            innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
        });
        
        header.appendChild(title);
        header.appendChild(settingsButton);
        
        wrapper.appendChild(header);
        
        // Create content based on showSettings state
        if (this.showSettings) {
            // Settings view
            const settingsContainer = createElement('div', { 
                className: 'bg-gray-50 p-4 rounded-md mb-4 animate-fadeIn'
            });
            
            const settingsTitle = createElement('h3', { className: 'font-semibold mb-2' }, 'Printer Settings');
            settingsContainer.appendChild(settingsTitle);
            
            // Create form grid
            const formGrid = createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' });
            
            // IP Address input
            const ipContainer = createElement('div');
            const ipLabel = createElement('label', { 
                className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Printer IP Address');
            
            const ipInput = createElement('input', {
                type: 'text',
                value: this.printerIP,
                placeholder: '192.168.1.100',
                className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500',
                disabled: this.isPrinterConnected,
                onInput: this.handleIPChange
            });
            
            ipContainer.appendChild(ipLabel);
            ipContainer.appendChild(ipInput);
            
            // Port input
            const portContainer = createElement('div');
            const portLabel = createElement('label', { 
                className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Port');
            
            const portInput = createElement('input', {
                type: 'text',
                value: this.printerPort,
                placeholder: '8008',
                className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500',
                disabled: this.isPrinterConnected,
                onInput: this.handlePortChange
            });
            
            portContainer.appendChild(portLabel);
            portContainer.appendChild(portInput);
            
            formGrid.appendChild(ipContainer);
            formGrid.appendChild(portContainer);
            
            settingsContainer.appendChild(formGrid);
            
            // Action buttons
            const actionContainer = createElement('div', { className: 'mt-4 flex flex-wrap gap-2' });
            
            if (!this.isPrinterConnected) {
                // Connect button
                const connectButton = createElement('button', {
                    className: 'bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-blue-300',
                    disabled: this.isConnecting,
                    onClick: this.connectToPrinter
                }, this.isConnecting ? 'Connecting...' : 'Connect');
                
                actionContainer.appendChild(connectButton);
            } else {
                // Disconnect button
                const disconnectButton = createElement('button', {
                    className: 'bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md',
                    onClick: this.disconnectPrinter
                }, 'Disconnect');
                
                // Test Print button
                const testPrintButton = createElement('button', {
                    className: 'bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md',
                    onClick: this.testPrint
                }, 'Test Print');
                
                actionContainer.appendChild(disconnectButton);
                actionContainer.appendChild(testPrintButton);
            }
            
            settingsContainer.appendChild(actionContainer);
            
            // Error message
            if (this.connectionError) {
                const errorMessage = createElement('div', { 
                    className: 'mt-2 text-red-500 text-sm'
                }, this.connectionError);
                
                settingsContainer.appendChild(errorMessage);
            }
            
            wrapper.appendChild(settingsContainer);
        } else {
            // Status view
            const statusContainer = createElement('div', { className: 'mb-4' });
            
            const statusDisplay = createElement('div', { className: 'flex items-center' });
            
            // Status indicator
            const statusIndicator = createElement('div', { 
                className: `w-3 h-3 rounded-full mr-2 ${
                    this.isPrinterConnected ? 'bg-green-500' : 'bg-red-500'
                }`
            });
            
            // Status text
            const statusText = createElement('span', {}, 
                this.isPrinterConnected 
                    ? `Connected to ${this.printerIP}` 
                    : 'No printer connected'
            );
            
            statusDisplay.appendChild(statusIndicator);
            statusDisplay.appendChild(statusText);
            
            statusContainer.appendChild(statusDisplay);
            
            // If we have printer status, show it
            if (this.isPrinterConnected && this.printerStatus) {
                const printerStatusContainer = createElement('div', { 
                    className: 'mt-2 text-sm text-gray-600'
                });
                
                const statusItems = [
                    { label: 'Online', value: this.printerStatus.online ? 'Yes' : 'No' },
                    { label: 'Paper', value: this.printerStatus.paper === 'ok' ? 'OK' : 'Low' },
                    { label: 'Cover', value: this.printerStatus.cover },
                    { label: 'Drawer', value: this.printerStatus.drawer }
                ];
                
                const statusGrid = createElement('div', { 
                    className: 'grid grid-cols-2 gap-x-4 gap-y-1 mt-1'
                });
                
                statusItems.forEach(item => {
                    const itemContainer = createElement('div', { 
                        className: 'flex justify-between'
                    });
                    
                    const label = createElement('span', { 
                        className: 'font-medium'
                    }, `${item.label}:`);
                    
                    const value = createElement('span', {}, item.value);
                    
                    itemContainer.appendChild(label);
                    itemContainer.appendChild(value);
                    
                    statusGrid.appendChild(itemContainer);
                });
                
                printerStatusContainer.appendChild(statusGrid);
                statusContainer.appendChild(printerStatusContainer);
                
                // Add refresh status button
                const refreshButton = createElement('button', {
                    className: 'mt-2 text-xs text-blue-600 hover:text-blue-800',
                    onClick: () => this.updatePrinterStatus()
                }, 'Refresh Status');
                
                statusContainer.appendChild(refreshButton);
            }
            
            wrapper.appendChild(statusContainer);
        }
        
        // Saved printers section
        if (this.savedPrinters.length > 0) {
            const savedPrintersContainer = createElement('div', { className: 'mt-4' });
            
            const savedPrintersTitle = createElement('h3', { 
                className: 'font-semibold mb-2 text-sm text-gray-700'
            }, 'Saved Printers');
            
            const savedPrintersGrid = createElement('div', { 
                className: 'grid grid-cols-1 md:grid-cols-2 gap-2'
            });
            
            // Add each saved printer
            this.savedPrinters.forEach((printer, index) => {
                const printerItem = createElement('div', { 
                    className: 'flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50'
                });
                
                // Printer info
                const printerInfo = createElement('div', { className: 'flex flex-col' });
                
                const printerName = createElement('span', { 
                    className: 'font-medium'
                }, printer.name || 'Unnamed Printer');
                
                const printerAddress = createElement('span', { 
                    className: 'text-xs text-gray-500'
                }, `${printer.ip}:${printer.port || '8008'}`);
                
                printerInfo.appendChild(printerName);
                printerInfo.appendChild(printerAddress);
                
                // Action buttons
                const actionButtons = createElement('div', { className: 'flex gap-2' });
                
                // Connect button
                const isConnected = this.isPrinterConnected && this.printerIP === printer.ip;
                const connectButton = createElement('button', {
                    className: `text-xs px-2 py-1 rounded ${
                        isConnected
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`,
                    disabled: isConnected,
                    onClick: isConnected ? null : () => this.connectToSavedPrinter(printer)
                }, isConnected ? 'Connected' : 'Connect');
                
                // Remove button
                const removeButton = createElement('button', {
                    className: 'text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200',
                    onClick: () => this.removeSavedPrinter(printer)
                }, 'Remove');
                
                actionButtons.appendChild(connectButton);
                actionButtons.appendChild(removeButton);
                
                printerItem.appendChild(printerInfo);
                printerItem.appendChild(actionButtons);
                
                savedPrintersGrid.appendChild(printerItem);
            });
            
            savedPrintersContainer.appendChild(savedPrintersTitle);
            savedPrintersContainer.appendChild(savedPrintersGrid);
            
            wrapper.appendChild(savedPrintersContainer);
        }
        
        // Add wrapper to container
        this.container.appendChild(wrapper);
        
        // Add animation styles if they don't exist
        this.addAnimationStyles();
    }
    
    /**
     * Add animation styles to the document
     */
    addAnimationStyles() {
        // Check if styles already exist
        if (document.getElementById('epson-printer-connect-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'epson-printer-connect-styles';
        
        // Add CSS
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-in-out;
            }
        `;
        
        // Add style to document head
        document.head.appendChild(style);
    }
}
