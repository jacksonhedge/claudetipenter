/**
 * POS Integration Component
 * Handles the UI for exporting receipt data to POS systems
 */
import { getAvailablePosSystemsOptions, exportToPosSystem, getPosSystemConfig, isPosSystemAuthenticated, authenticateWithPosSystem } from '../services/posService.js';
import { showNotification } from '../utils/uiUtils.js';

export default class PosIntegration {
    constructor(options = {}) {
        // DOM element IDs
        this.containerId = options.containerId || 'posIntegrationContainer';
        this.exportBtnId = options.exportBtnId || 'posExportBtn';
        this.posSystemSelectId = options.posSystemSelectId || 'posSystemSelect';
        this.previewContainerId = options.previewContainerId || 'posDataPreview';
        
        // State
        this.currentData = null;
        this.selectedPosSystem = 'lightspeed'; // Default POS system
        
        // Initialize the component
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Get DOM elements
        this.container = document.getElementById(this.containerId);
        this.exportBtn = document.getElementById(this.exportBtnId);
        this.posSystemSelect = document.getElementById(this.posSystemSelectId);
        this.previewContainer = document.getElementById(this.previewContainerId);
        
        if (!this.container) {
            console.error(`POS Integration container with ID '${this.containerId}' not found`);
            return;
        }
        
        // Populate POS system select options
        this.populatePosSystemOptions();
        
        // Add event listeners
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', this.handleExport.bind(this));
        }
        
        if (this.posSystemSelect) {
            this.posSystemSelect.addEventListener('change', this.handlePosSystemChange.bind(this));
        }
    }
    
    /**
     * Populate POS system select options
     */
    populatePosSystemOptions() {
        if (!this.posSystemSelect) return;
        
        // Clear existing options
        this.posSystemSelect.innerHTML = '';
        
        // Get available POS systems
        const posSystemOptions = getAvailablePosSystemsOptions();
        
        // Add options to select
        posSystemOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            this.posSystemSelect.appendChild(optionElement);
        });
        
        // Set default selected option
        this.posSystemSelect.value = this.selectedPosSystem;
    }
    
    /**
     * Handle POS system change
     * @param {Event} event - The change event
     */
    handlePosSystemChange(event) {
        this.selectedPosSystem = event.target.value;
        
        // Update preview if data is available
        if (this.currentData) {
            this.updatePreview(this.currentData);
        }
    }
    
    /**
     * Handle export button click
     */
    async handleExport() {
        if (!this.currentData) {
            showNotification('No data to export', 'error');
            return;
        }
        
        try {
            // Show loading state
            this.exportBtn.disabled = true;
            this.exportBtn.textContent = 'Exporting...';
            
            // Check if authenticated with the POS system
            const isAuthenticated = await isPosSystemAuthenticated(this.selectedPosSystem);
            
            // If Lightspeed is selected and not authenticated, show authentication button
            if (this.selectedPosSystem === 'lightspeed' && !isAuthenticated) {
                // Show authentication button
                this.showAuthenticationButton();
                return;
            }
            
            // Export data to selected POS system
            const result = await exportToPosSystem(this.currentData, this.selectedPosSystem);
            
            // If authentication is required, the user will be redirected
            if (result.auth_required) {
                return;
            }
            
            // Show success notification
            showNotification(result.message, 'success');
        } catch (error) {
            console.error('Error exporting to POS system:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        } finally {
            // Reset button state
            this.exportBtn.disabled = false;
            this.exportBtn.textContent = 'Export to POS';
        }
    }
    
    /**
     * Show authentication button for Lightspeed
     */
    showAuthenticationButton() {
        // Reset button state
        this.exportBtn.disabled = false;
        this.exportBtn.textContent = 'Authenticate with Lightspeed';
        
        // Change button color to indicate authentication is required
        this.exportBtn.classList.add('auth-required');
        
        // Change click handler to authenticate
        this.exportBtn.removeEventListener('click', this.handleExport.bind(this));
        this.exportBtn.addEventListener('click', this.handleAuthenticate.bind(this));
    }
    
    /**
     * Handle authenticate button click
     */
    async handleAuthenticate() {
        try {
            // Show loading state
            this.exportBtn.disabled = true;
            this.exportBtn.textContent = 'Authenticating...';
            
            // Authenticate with the POS system
            await authenticateWithPosSystem(this.selectedPosSystem);
            
            // The user will be redirected to the authentication page
        } catch (error) {
            console.error('Error authenticating with POS system:', error);
            showNotification(`Authentication failed: ${error.message}`, 'error');
            
            // Reset button state
            this.exportBtn.disabled = false;
            this.exportBtn.textContent = 'Authenticate with Lightspeed';
        }
    }
    
    /**
     * Set receipt data and update preview
     * @param {Object} data - The receipt data
     */
    setData(data) {
        this.currentData = data;
        this.updatePreview(data);
        
        // Enable export button if data is valid
        if (this.exportBtn && data && data.results && data.results.length > 0) {
            this.exportBtn.disabled = false;
            
            // Reset button to default state
            this.exportBtn.classList.remove('auth-required');
            this.exportBtn.textContent = 'Export to POS';
            
            // Remove any existing event listeners
            this.exportBtn.removeEventListener('click', this.handleAuthenticate.bind(this));
            
            // Add export event listener
            this.exportBtn.addEventListener('click', this.handleExport.bind(this));
        } else if (this.exportBtn) {
            this.exportBtn.disabled = true;
        }
        
        // Check if we need to show authentication button
        if (this.selectedPosSystem === 'lightspeed') {
            isPosSystemAuthenticated('lightspeed').then(isAuthenticated => {
                if (!isAuthenticated && this.exportBtn && !this.exportBtn.disabled) {
                    this.showAuthenticationButton();
                }
            });
        }
    }
    
    /**
     * Update the data preview
     * @param {Object} data - The receipt data
     */
    updatePreview(data) {
        if (!this.previewContainer || !data || !data.results || data.results.length === 0) {
            return;
        }
        
        // Get POS system configuration
        const posConfig = getPosSystemConfig(this.selectedPosSystem);
        if (!posConfig) {
            console.error(`POS system configuration for '${this.selectedPosSystem}' not found`);
            return;
        }
        
        // Create table for preview
        const table = document.createElement('table');
        table.className = 'pos-preview-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        posConfig.fields.forEach(field => {
            const th = document.createElement('th');
            th.textContent = field.label;
            if (field.required) {
                th.className = 'required';
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body with sample data (first 3 rows)
        const tbody = document.createElement('tbody');
        const sampleData = data.results.slice(0, 3);
        
        sampleData.forEach((receipt, index) => {
            const row = document.createElement('tr');
            
            // Extract numeric values from monetary strings
            const amount = parseFloat(receipt.amount?.replace(/[^0-9.-]+/g, '') || 0);
            const tip = parseFloat(receipt.tip?.replace(/[^0-9.-]+/g, '') || 0);
            const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
            
            // Map fields based on POS system
            if (this.selectedPosSystem === 'lightspeed') {
                posConfig.fields.forEach(field => {
                    const td = document.createElement('td');
                    
                    switch (field.key) {
                        case 'id':
                            td.textContent = receipt.check_number || (index + 1).toString();
                            break;
                        case 'name':
                            td.textContent = receipt.customer_name || 'Unknown';
                            break;
                        case 'server':
                            td.textContent = 'Server'; // Default value
                            break;
                        case 'time':
                            td.textContent = receipt.time || new Date().toLocaleTimeString();
                            break;
                        case 'guests':
                            td.textContent = '1'; // Default value
                            break;
                        case 'comps':
                            td.textContent = '0.00';
                            break;
                        case 'voids':
                            td.textContent = '0.00';
                            break;
                        case 'netSales':
                            td.textContent = amount.toFixed(2);
                            break;
                        case 'autoGrat':
                            td.textContent = '0.00';
                            break;
                        case 'tax':
                            td.textContent = (amount * 0.07).toFixed(2); // Assuming 7% tax
                            break;
                        case 'billTotal':
                            td.textContent = amount.toFixed(2);
                            break;
                        case 'payment':
                            td.textContent = receipt.payment_type || 'Credit Card';
                            break;
                        case 'tips':
                            td.textContent = tip.toFixed(2);
                            break;
                        case 'cash':
                            td.textContent = receipt.payment_type?.toLowerCase() === 'cash' ? total.toFixed(2) : '0.00';
                            break;
                        case 'credit':
                            td.textContent = receipt.payment_type?.toLowerCase() !== 'cash' ? total.toFixed(2) : '0.00';
                            break;
                        case 'tenders':
                            td.textContent = receipt.payment_type || 'Credit Card';
                            break;
                        case 'revCtr':
                            td.textContent = 'Main';
                            break;
                        default:
                            td.textContent = '';
                    }
                    
                    row.appendChild(td);
                });
            } else if (this.selectedPosSystem === 'toast') {
                posConfig.fields.forEach(field => {
                    const td = document.createElement('td');
                    
                    switch (field.key) {
                        case 'orderId':
                            td.textContent = receipt.check_number || (index + 1).toString();
                            break;
                        case 'customerName':
                            td.textContent = receipt.customer_name || 'Unknown';
                            break;
                        case 'orderTime':
                            td.textContent = receipt.time || new Date().toLocaleTimeString();
                            break;
                        case 'subtotal':
                            td.textContent = amount.toFixed(2);
                            break;
                        case 'tax':
                            td.textContent = (amount * 0.07).toFixed(2); // Assuming 7% tax
                            break;
                        case 'tip':
                            td.textContent = tip.toFixed(2);
                            break;
                        case 'total':
                            td.textContent = total.toFixed(2);
                            break;
                        case 'paymentMethod':
                            td.textContent = receipt.payment_type || 'Credit Card';
                            break;
                        default:
                            td.textContent = '';
                    }
                    
                    row.appendChild(td);
                });
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        // Clear previous content and add table
        this.previewContainer.innerHTML = '';
        
        // Add preview header
        const previewHeader = document.createElement('div');
        previewHeader.className = 'pos-preview-header';
        previewHeader.innerHTML = `
            <h4>Data Preview (${posConfig.name} Format)</h4>
            <p class="preview-note">Showing ${sampleData.length} of ${data.results.length} records</p>
        `;
        this.previewContainer.appendChild(previewHeader);
        
        // Add table
        this.previewContainer.appendChild(table);
        
        // Add note about required fields
        const requiredNote = document.createElement('div');
        requiredNote.className = 'required-note';
        requiredNote.innerHTML = '<span class="required-marker"></span> Required fields';
        this.previewContainer.appendChild(requiredNote);
    }
}
