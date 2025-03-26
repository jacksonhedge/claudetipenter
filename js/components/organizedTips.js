/**
 * Organized Tips Component
 * 
 * This component handles the display and functionality of the organized tips UI
 * based on the design provided in the React component.
 */

class OrganizedTips {
    constructor() {
        this.payments = [];
        this.totalTipAmount = 0;
        this.container = document.getElementById('organizedTipsList');
        this.totalElement = document.getElementById('totalTipAmount');
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners for the organized tips UI
     */
    initEventListeners() {
        // Add event listeners for filters and dropdowns
        const filterDropdowns = document.querySelectorAll('.filter-value');
        filterDropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', () => {
                // Toggle dropdown menu (to be implemented)
                console.log('Filter dropdown clicked');
            });
        });
        
        // Add event listeners for the view control buttons
        this.gridViewBtn = document.getElementById('gridViewBtn');
        this.slideshowViewBtn = document.getElementById('slideshowViewBtn');
        this.exportSlideshowBtn = document.getElementById('exportSlideshowBtn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        
        // Grid View button
        if (this.gridViewBtn) {
            this.gridViewBtn.addEventListener('click', () => {
                console.log('Grid View button clicked');
                // Set active state for this button
                this.gridViewBtn.classList.add('active');
                if (this.slideshowViewBtn) this.slideshowViewBtn.classList.remove('active');
                
                // Find the organizer grid component and trigger its grid view mode
                const organizedGrid = document.getElementById('organizedGrid');
                if (organizedGrid && organizedGrid.__component) {
                    organizedGrid.__component.setViewMode('grid');
                }
            });
        }
        
        // Slideshow View button
        if (this.slideshowViewBtn) {
            this.slideshowViewBtn.addEventListener('click', () => {
                console.log('Slideshow View button clicked');
                // Set active state for this button
                this.slideshowViewBtn.classList.add('active');
                if (this.gridViewBtn) this.gridViewBtn.classList.remove('active');
                
                // Find the organizer grid component and trigger its slideshow view mode
                const organizedGrid = document.getElementById('organizedGrid');
                if (organizedGrid && organizedGrid.__component) {
                    organizedGrid.__component.setViewMode('slideshow');
                }
            });
        }
        
        // Export Slideshow button
        if (this.exportSlideshowBtn) {
            this.exportSlideshowBtn.addEventListener('click', () => {
                console.log('Export Slideshow button clicked');
                // Dispatch a custom event to open the export options modal
                const event = new CustomEvent('exportOptions:open', {
                    detail: { source: 'slideshow' }
                });
                document.dispatchEvent(event);
            });
        }
        
        // Export PDF button
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => {
                console.log('Export PDF button clicked');
                // Find the organizer grid component and trigger its export PDF method
                const organizedGrid = document.getElementById('organizedGrid');
                if (organizedGrid && organizedGrid.__component && organizedGrid.__component.handleExportPdf) {
                    organizedGrid.__component.handleExportPdf();
                }
            });
        }
    }
    
    /**
     * Set the payment data and render the UI
     * @param {Array} payments - Array of payment objects
     */
    setPayments(payments) {
        this.payments = payments;
        this.calculateTotal();
        this.render();
    }
    
    /**
     * Calculate the total tip amount
     */
    calculateTotal() {
        this.totalTipAmount = this.payments.reduce((sum, payment) => sum + (payment.tip || 0), 0);
        
        // Update the total display
        if (this.totalElement) {
            this.totalElement.textContent = `$${this.totalTipAmount.toFixed(2)}`;
        }
    }
    
    /**
     * Render the payment items in the UI
     */
    render() {
        if (!this.container) return;
        
        // Clear the container
        this.container.innerHTML = '';
        
        // If no payments, show empty state
        if (this.payments.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No payment data available. Process images in the Tip Analyzer tab first.</p>
                </div>
            `;
            return;
        }
        
        // Render each payment item
        this.payments.forEach(payment => {
            const paymentItem = document.createElement('div');
            paymentItem.className = 'payment-item';
            
            // Determine card type icon
            let cardIcon = '';
            switch (payment.payment_type?.toLowerCase() || 'unknown') {
                case 'visa':
                    cardIcon = '<div class="visa-icon">VISA</div>';
                    break;
                case 'mastercard':
                    cardIcon = `
                        <div class="mastercard-icon">
                            <div class="mastercard-red"></div>
                            <div class="mastercard-yellow"></div>
                        </div>
                    `;
                    break;
                case 'discover':
                    cardIcon = '<div class="discover-icon">discover</div>';
                    break;
                default:
                    cardIcon = payment.payment_type || 'Unknown';
            }
            
            // Format the payment data
            const tab = payment.check_number || payment.tab || 'N/A';
            const cardNumber = payment.card_number || 'N/A';
            const customerName = payment.customer_name || 'UNKNOWN';
            const amount = payment.amount || 0;
            const total = payment.total || amount;
            const tip = payment.tip || 0;
            
            // Create the payment item HTML
            paymentItem.innerHTML = `
                <div class="payment-tab">
                    <div class="label">Tab</div>
                    <div class="value">${tab}</div>
                </div>
                <div class="payment-card">
                    <div class="card-icon">
                        ${cardIcon}
                    </div>
                    <div class="card-info">
                        <div class="card-number">${cardNumber}</div>
                        <div class="card-name">${customerName}</div>
                    </div>
                </div>
                <div class="payment-amount">
                    <div class="amount-group">
                        <div class="amount-label">Total</div>
                        <div class="amount-value">$${total.toFixed(2)}</div>
                    </div>
                    <div class="amount-group">
                        <div class="amount-label">Paid</div>
                        <div class="amount-value">$${total.toFixed(2)}</div>
                    </div>
                </div>
                <div class="payment-tip">
                    <div class="tip-amount">$${tip.toFixed(2)}</div>
                    <div class="tip-label">TIP</div>
                </div>
            `;
            
            // Add the payment item to the container
            this.container.appendChild(paymentItem);
        });
    }
    
    /**
     * Load sample data for demonstration purposes
     */
    loadSampleData() {
        const samplePayments = [
            {
                tab: "2501",
                payment_type: "visa",
                card_number: "0046",
                customer_name: "JEFFREY GIULIANA",
                total: 28.65,
                tip: 4.00
            },
            {
                tab: "2858",
                payment_type: "discover",
                card_number: "2393",
                customer_name: "MICHAEL TREMEL",
                total: 13.78,
                tip: 2.00
            },
            {
                tab: "3363",
                payment_type: "mastercard",
                card_number: "6472",
                customer_name: "MARCUS J WILLIAMS",
                total: 4.96,
                tip: 1.50
            },
            {
                tab: "3418",
                payment_type: "mastercard",
                card_number: "5056",
                customer_name: "DAVID PETROV",
                total: 23.64,
                tip: 10.00
            },
            {
                tab: "4486",
                payment_type: "mastercard",
                card_number: "0874",
                customer_name: "TYLER J WILLENBRINK",
                total: 8.82,
                tip: 1.00
            },
            {
                tab: "5732",
                payment_type: "visa",
                card_number: "1032",
                customer_name: "GRANT BERNAUER",
                total: 30.86,
                tip: 6.00
            },
            {
                tab: "6441",
                payment_type: "visa",
                card_number: "1394",
                customer_name: "UNKNOWN",
                total: 10.20,
                tip: 2.00
            }
        ];
        
        this.setPayments(samplePayments);
    }
}

// Initialize the organized tips component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const organizedTips = new OrganizedTips();
    
    // Make the component available globally
    window.organizedTips = organizedTips;
});
