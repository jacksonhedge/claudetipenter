/**
 * Tips History Component
 * 
 * This component handles the display and functionality of the tips history UI
 * showing a log of receipt data based on date and time.
 */

class TipsHistory {
    constructor() {
        this.historyData = [];
        this.container = document.getElementById('tipsHistoryContainer');
        this.emptyState = document.getElementById('tipsHistoryEmptyState');
        this.historyList = document.getElementById('tipsHistoryList');
        
        // Initialize local storage key
        this.storageKey = 'tipenter_tips_history';
        
        // Load history data from local storage
        this.loadHistoryData();
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners for the tips history UI
     */
    initEventListeners() {
        // Add event listener for clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all tips history?')) {
                    this.clearHistory();
                }
            });
        }
        
        // Add event listener for export history button
        const exportHistoryBtn = document.getElementById('exportHistoryBtn');
        if (exportHistoryBtn) {
            exportHistoryBtn.addEventListener('click', () => {
                this.exportHistory();
            });
        }
    }
    
    /**
     * Load history data from local storage
     */
    loadHistoryData() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (storedData) {
                this.historyData = JSON.parse(storedData);
            }
        } catch (error) {
            console.error('Error loading tips history data:', error);
            this.historyData = [];
        }
        
        // Render the history data
        this.render();
    }
    
    /**
     * Save history data to local storage
     */
    saveHistoryData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.historyData));
        } catch (error) {
            console.error('Error saving tips history data:', error);
        }
    }
    
    /**
     * Add new receipt data to history
     * @param {Object} data - The receipt data object
     */
    addToHistory(data) {
        if (!data || !data.results || data.results.length === 0) return;
        
        // Create a history entry with timestamp and data
        const historyEntry = {
            timestamp: new Date().toISOString(),
            data: data,
            totalReceipts: data.results.length,
            totalTips: this.calculateTotalTips(data.results)
        };
        
        // Add to history data
        this.historyData.unshift(historyEntry); // Add to beginning of array
        
        // Limit history to 100 entries
        if (this.historyData.length > 100) {
            this.historyData = this.historyData.slice(0, 100);
        }
        
        // Save to local storage
        this.saveHistoryData();
        
        // Re-render the UI
        this.render();
    }
    
    /**
     * Calculate total tips from receipt data
     * @param {Array} results - Array of receipt results
     * @returns {number} - Total tip amount
     */
    calculateTotalTips(results) {
        return results.reduce((total, item) => {
            if (item.tip) {
                // Extract numeric value from tip string (e.g. "$10.50" -> 10.50)
                const tipValue = parseFloat(item.tip.replace(/[^0-9.-]+/g, ''));
                if (!isNaN(tipValue)) {
                    return total + tipValue;
                }
            }
            return total;
        }, 0);
    }
    
    /**
     * Clear all history data
     */
    clearHistory() {
        this.historyData = [];
        this.saveHistoryData();
        this.render();
    }
    
    /**
     * Export history data as CSV
     */
    exportHistory() {
        if (this.historyData.length === 0) {
            alert('No history data to export');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Date,Time,Total Receipts,Total Tips\n';
        
        this.historyData.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            
            csvContent += `${dateStr},${timeStr},${entry.totalReceipts},$${entry.totalTips.toFixed(2)}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tips_history_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    }
    
    /**
     * Format time for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted time string
     */
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Render the history data in the UI
     */
    render() {
        if (!this.container || !this.historyList) return;
        
        // Show/hide empty state
        if (this.emptyState) {
            this.emptyState.style.display = this.historyData.length === 0 ? 'block' : 'none';
        }
        
        // Clear the history list
        this.historyList.innerHTML = '';
        
        // Render each history entry
        this.historyData.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Format date and time
            const dateStr = this.formatDate(entry.timestamp);
            const timeStr = this.formatTime(entry.timestamp);
            
            // Create the history item HTML
            historyItem.innerHTML = `
                <div class="history-header">
                    <div class="history-date-time">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-time">${timeStr}</div>
                    </div>
                    <div class="history-summary">
                        <div class="history-receipts">
                            <span class="label">Receipts:</span>
                            <span class="value">${entry.totalReceipts}</span>
                        </div>
                        <div class="history-total-tips">
                            <span class="label">Total Tips:</span>
                            <span class="value">$${entry.totalTips.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="history-view-btn" data-index="${index}">View Details</button>
                    </div>
                </div>
                <div class="history-details" id="historyDetails${index}" style="display: none;">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Check #</th>
                                <th>Amount</th>
                                <th>Tip</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderReceiptRows(entry.data.results)}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Add the history item to the container
            this.historyList.appendChild(historyItem);
            
            // Add event listener for view details button
            const viewBtn = historyItem.querySelector(`.history-view-btn[data-index="${index}"]`);
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    const detailsEl = document.getElementById(`historyDetails${index}`);
                    if (detailsEl) {
                        // Toggle details visibility
                        const isVisible = detailsEl.style.display !== 'none';
                        detailsEl.style.display = isVisible ? 'none' : 'block';
                        viewBtn.textContent = isVisible ? 'View Details' : 'Hide Details';
                    }
                });
            }
        });
    }
    
    /**
     * Render receipt rows for a history entry
     * @param {Array} receipts - Array of receipt data
     * @returns {string} - HTML for receipt rows
     */
    renderReceiptRows(receipts) {
        if (!receipts || receipts.length === 0) {
            return '<tr><td colspan="5">No receipt data available</td></tr>';
        }
        
        return receipts.map(receipt => {
            // Extract values with fallbacks
            const customerName = receipt.customer_name || 'Unknown';
            const checkNumber = receipt.check_number || 'N/A';
            const amount = receipt.amount || '$0.00';
            const tip = receipt.tip || '$0.00';
            const total = receipt.total || receipt.amount || '$0.00';
            
            return `
                <tr>
                    <td>${customerName}</td>
                    <td>${checkNumber}</td>
                    <td>${amount}</td>
                    <td>${tip}</td>
                    <td>${total}</td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Load sample data for demonstration purposes
     */
    loadSampleData() {
        // Sample data for demonstration
        const sampleData = [
            {
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                data: {
                    results: [
                        { customer_name: "John Smith", check_number: "1234", amount: "$25.50", tip: "$5.00", total: "$30.50" },
                        { customer_name: "Jane Doe", check_number: "1235", amount: "$18.75", tip: "$3.75", total: "$22.50" },
                        { customer_name: "Bob Johnson", check_number: "1236", amount: "$32.00", tip: "$6.40", total: "$38.40" }
                    ]
                },
                totalReceipts: 3,
                totalTips: 15.15
            },
            {
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                data: {
                    results: [
                        { customer_name: "Alice Brown", check_number: "1237", amount: "$42.25", tip: "$8.45", total: "$50.70" },
                        { customer_name: "Charlie Davis", check_number: "1238", amount: "$15.50", tip: "$3.10", total: "$18.60" }
                    ]
                },
                totalReceipts: 2,
                totalTips: 11.55
            },
            {
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                data: {
                    results: [
                        { customer_name: "Eva Wilson", check_number: "1239", amount: "$28.75", tip: "$5.75", total: "$34.50" },
                        { customer_name: "Frank Miller", check_number: "1240", amount: "$35.00", tip: "$7.00", total: "$42.00" },
                        { customer_name: "Grace Taylor", check_number: "1241", amount: "$19.25", tip: "$3.85", total: "$23.10" },
                        { customer_name: "Henry Clark", check_number: "1242", amount: "$22.50", tip: "$4.50", total: "$27.00" }
                    ]
                },
                totalReceipts: 4,
                totalTips: 21.10
            }
        ];
        
        this.historyData = sampleData;
        this.saveHistoryData();
        this.render();
    }
}

// Export the TipsHistory class
export default TipsHistory;
