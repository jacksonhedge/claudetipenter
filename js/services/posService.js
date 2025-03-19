/**
 * Service for handling POS (Point of Sale) system integrations
 */
import { showNotification } from '../utils/uiUtils.js';

/**
 * POS system configurations
 */
const POS_SYSTEMS = {
    lightspeed: {
        name: 'Lightspeed',
        fields: [
            { key: 'id', label: '#', required: true },
            { key: 'name', label: 'Name', required: true },
            { key: 'server', label: 'Server', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'guests', label: 'Guests', required: false },
            { key: 'comps', label: 'Comps', required: false },
            { key: 'voids', label: 'Voids', required: false },
            { key: 'netSales', label: 'Net Sales', required: true },
            { key: 'autoGrat', label: 'Auto Grat', required: false },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'billTotal', label: 'Bill Total', required: true },
            { key: 'payment', label: 'Payment', required: true },
            { key: 'tips', label: 'Tips', required: true },
            { key: 'cash', label: 'Cash', required: false },
            { key: 'credit', label: 'Credit', required: false },
            { key: 'tenders', label: 'Tenders', required: false },
            { key: 'revCtr', label: 'Rev Ctr', required: false }
        ],
        endpoint: '/api/pos/lightspeed'
    },
    square: {
        name: 'Square',
        fields: [
            { key: 'id', label: 'Transaction ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true },
            { key: 'location', label: 'Location', required: false }
        ],
        endpoint: '/api/pos/square'
    },
    toast: {
        name: 'Toast',
        fields: [
            { key: 'orderId', label: 'Order ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'orderTime', label: 'Order Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true }
        ],
        endpoint: '/api/pos/toast'
    },
    harbortouch: {
        name: 'Harbortouch',
        fields: [
            { key: 'checkId', label: 'Check ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'server', label: 'Server', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true },
            { key: 'tableNumber', label: 'Table Number', required: false }
        ],
        endpoint: '/api/pos/harbortouch'
    },
    revel: {
        name: 'Revel Systems',
        fields: [
            { key: 'orderId', label: 'Order ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'employee', label: 'Employee', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true },
            { key: 'establishment', label: 'Establishment', required: false }
        ],
        endpoint: '/api/pos/revel'
    },
    clover: {
        name: 'Clover',
        fields: [
            { key: 'orderId', label: 'Order ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'employee', label: 'Employee', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true }
        ],
        endpoint: '/api/pos/clover'
    },
    shopify: {
        name: 'Shopify',
        fields: [
            { key: 'orderId', label: 'Order ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true },
            { key: 'store', label: 'Store', required: false }
        ],
        endpoint: '/api/pos/shopify'
    },
    maxxpay: {
        name: 'MaxxPay',
        fields: [
            { key: 'transactionId', label: 'Transaction ID', required: true },
            { key: 'customerName', label: 'Customer Name', required: true },
            { key: 'time', label: 'Time', required: true },
            { key: 'subtotal', label: 'Subtotal', required: true },
            { key: 'tax', label: 'Tax', required: true },
            { key: 'tip', label: 'Tip', required: true },
            { key: 'total', label: 'Total', required: true },
            { key: 'paymentMethod', label: 'Payment Method', required: true }
        ],
        endpoint: '/api/pos/maxxpay'
    }
};

/**
 * Map receipt data to POS system format
 * @param {Object} receiptData - The receipt data from the application
 * @param {string} posSystem - The POS system to map to (e.g., 'lightspeed')
 * @returns {Object} - The mapped data in the format expected by the POS system
 */
export function mapReceiptDataToPosFormat(receiptData, posSystem = 'lightspeed') {
    if (!POS_SYSTEMS[posSystem]) {
        throw new Error(`Unknown POS system: ${posSystem}`);
    }

    const posConfig = POS_SYSTEMS[posSystem];
    
    if (posSystem === 'lightspeed') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                id: receipt.check_number || (index + 1).toString(),
                name: receipt.customer_name || 'Unknown',
                server: 'Server', // Default value, could be extracted if available
                time: receipt.time || new Date().toLocaleTimeString(),
                guests: '1', // Default value, could be extracted if available
                comps: '0.00',
                voids: '0.00',
                netSales: amount.toFixed(2),
                autoGrat: '0.00',
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                billTotal: amount.toFixed(2),
                payment: receipt.payment_type || 'Credit Card',
                tips: tip.toFixed(2),
                cash: receipt.payment_type?.toLowerCase() === 'cash' ? total.toFixed(2) : '0.00',
                credit: receipt.payment_type?.toLowerCase() !== 'cash' ? total.toFixed(2) : '0.00',
                tenders: receipt.payment_type || 'Credit Card',
                revCtr: 'Main'
            };
        });
    } else if (posSystem === 'toast') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                orderId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                orderTime: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card'
            };
        });
    } else if (posSystem === 'square') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                id: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card',
                location: 'Main Location' // Default value
            };
        });
    } else if (posSystem === 'harbortouch') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                checkId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                server: 'Server', // Default value
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card',
                tableNumber: '1' // Default value
            };
        });
    } else if (posSystem === 'revel') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                orderId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                employee: 'Employee', // Default value
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card',
                establishment: 'Main Establishment' // Default value
            };
        });
    } else if (posSystem === 'clover') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                orderId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                employee: 'Employee', // Default value
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card'
            };
        });
    } else if (posSystem === 'shopify') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                orderId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card',
                store: 'Main Store' // Default value
            };
        });
    } else if (posSystem === 'maxxpay') {
        return receiptData.results.map((receipt, index) => {
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            return {
                transactionId: receipt.check_number || (index + 1).toString(),
                customerName: receipt.customer_name || 'Unknown',
                time: receipt.time || new Date().toLocaleTimeString(),
                subtotal: amount.toFixed(2),
                tax: (amount * 0.07).toFixed(2), // Assuming 7% tax, adjust as needed
                tip: tip.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: receipt.payment_type || 'Credit Card'
            };
        });
    }
    
    // Default case - return original data
    return receiptData.results;
}

/**
 * Check if the user is authenticated with a POS system
 * @param {string} posSystem - The POS system to check (e.g., 'lightspeed')
 * @returns {Promise<boolean>} - Promise resolving to true if authenticated
 */
export async function isPosSystemAuthenticated(posSystem = 'lightspeed') {
    try {
        if (!POS_SYSTEMS[posSystem]) {
            throw new Error(`Unknown POS system: ${posSystem}`);
        }
        
        // In a real implementation, this would check if we have a valid access token
        // For now, we'll check if the URL has a lightspeed_auth=success parameter
        if (posSystem === 'lightspeed') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('lightspeed_auth') === 'success') {
                return true;
            }
            
            // We could also check localStorage or sessionStorage for a token
            const token = localStorage.getItem('lightspeed_access_token');
            if (token) {
                return true;
            }
        }
        
        // Check for other POS systems
        const tokenKey = `${posSystem}_access_token`;
        const token = localStorage.getItem(tokenKey);
        if (token) {
            return true;
        }
        
        // For demo purposes, assume these systems don't require authentication
        if (['toast', 'square', 'harbortouch', 'revel', 'clover', 'shopify', 'maxxpay'].includes(posSystem)) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error checking authentication for ${posSystem}:`, error);
        return false;
    }
}

/**
 * Authenticate with a POS system
 * @param {string} posSystem - The POS system to authenticate with (e.g., 'lightspeed')
 * @returns {Promise<void>} - Promise that resolves when authentication is complete
 */
export async function authenticateWithPosSystem(posSystem = 'lightspeed') {
    try {
        if (!POS_SYSTEMS[posSystem]) {
            throw new Error(`Unknown POS system: ${posSystem}`);
        }
        
        // Redirect to the authentication endpoint for the selected POS system
        const endpoint = `/api/pos/${posSystem}/auth`;
        console.log(`Redirecting to ${endpoint} for authentication...`);
        
        // In a real application, you would redirect to the authentication endpoint
        // window.location.href = endpoint;
        
        // For demo purposes, simulate a successful authentication
        showNotification(`Authenticating with ${POS_SYSTEMS[posSystem].name}...`, 'info');
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store a fake token in localStorage
        localStorage.setItem(`${posSystem}_access_token`, 'demo_token');
        
        showNotification(`Successfully authenticated with ${POS_SYSTEMS[posSystem].name}`, 'success');
    } catch (error) {
        console.error(`Error authenticating with ${posSystem}:`, error);
        showNotification(`Failed to authenticate with ${POS_SYSTEMS[posSystem]?.name || posSystem}: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Export receipt data to a POS system
 * @param {Object} receiptData - The receipt data from the application
 * @param {string} posSystem - The POS system to export to (e.g., 'lightspeed')
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
export async function exportToPosSystem(receiptData, posSystem = 'lightspeed') {
    try {
        if (!receiptData || !receiptData.results || receiptData.results.length === 0) {
            throw new Error('No receipt data to export');
        }
        
        if (!POS_SYSTEMS[posSystem]) {
            throw new Error(`Unknown POS system: ${posSystem}`);
        }
        
        // Check if authenticated with the POS system
        const isAuthenticated = await isPosSystemAuthenticated(posSystem);
        if (!isAuthenticated) {
            // Show notification that authentication is required
            showNotification(`Authentication required for ${POS_SYSTEMS[posSystem].name}. Redirecting...`, 'info');
            
            // Redirect to authentication endpoint
            await authenticateWithPosSystem(posSystem);
            
            // Check if we're now authenticated
            const nowAuthenticated = await isPosSystemAuthenticated(posSystem);
            if (!nowAuthenticated) {
                return {
                    success: false,
                    message: 'Authentication required',
                    auth_required: true
                };
            }
        }
        
        const posConfig = POS_SYSTEMS[posSystem];
        const mappedData = mapReceiptDataToPosFormat(receiptData, posSystem);
        
        // Make API call to the server endpoint
        console.log(`Exporting ${mappedData.length} receipts to ${posConfig.name}...`);
        
        const response = await fetch(posConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receipts: mappedData
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Check if authentication is required
            if (response.status === 401 && errorData.auth_url) {
                // Redirect to authentication endpoint
                window.location.href = errorData.auth_url;
                return {
                    success: false,
                    message: 'Authentication required',
                    auth_required: true
                };
            }
            
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const result = await response.json();
        
        showNotification(`Successfully exported ${mappedData.length} receipts to ${posConfig.name}`, 'success');
        return result;
    } catch (error) {
        console.error(`Error exporting to ${posSystem}:`, error);
        showNotification(`Failed to export to ${POS_SYSTEMS[posSystem]?.name || posSystem}: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Get available POS systems
 * @returns {Array} - Array of available POS systems
 */
export function getAvailablePosSystemsOptions() {
    return Object.keys(POS_SYSTEMS).map(key => ({
        value: key,
        label: POS_SYSTEMS[key].name
    }));
}

/**
 * Get POS system configuration
 * @param {string} posSystem - The POS system to get configuration for
 * @returns {Object} - The POS system configuration
 */
export function getPosSystemConfig(posSystem) {
    return POS_SYSTEMS[posSystem] || null;
}
