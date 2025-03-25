/**
 * Bar Selector Component
 * 
 * This component provides a UI for selecting a bar from a list of available bars.
 */

import barService from '../services/barService.js';

class BarSelector {
    constructor(options = {}) {
        this.containerId = options.containerId || 'barSelectorContainer';
        this.container = document.getElementById(this.containerId);
        this.onBarSelected = options.onBarSelected || null;
        
        // Create the component if the container exists
        if (this.container) {
            this.render();
        }
    }
    
    /**
     * Initialize the component
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Initialize the bar service
            await barService.init();
            
            // Render the component
            this.render();
            
            // Set up event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing bar selector:', error);
        }
    }
    
    /**
     * Render the bar selector component
     */
    render() {
        if (!this.container) return;
        
        // Get the list of bars
        const bars = barService.getBars();
        const selectedBar = barService.getSelectedBar();
        
        // Create the component HTML
        this.container.innerHTML = `
            <div class="bar-selector">
                <div class="bar-selector-header">
                    <label for="barSelect">Select Your Bar:</label>
                    <div class="bar-select-wrapper">
                        <select id="barSelect" class="bar-select">
                            <option value="">-- Select a Bar --</option>
                            ${bars.map(bar => `
                                <option value="${bar.id}" ${selectedBar && selectedBar.id === bar.id ? 'selected' : ''}>
                                    ${bar.name}
                                </option>
                            `).join('')}
                        </select>
                        <div class="bar-select-arrow">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                </div>
                <div class="bar-details" id="barDetails" style="display: ${selectedBar ? 'block' : 'none'}">
                    <div class="bar-name">${selectedBar ? selectedBar.name : ''}</div>
                    <div class="bar-location">${selectedBar ? selectedBar.location : ''}</div>
                    <div class="bar-type">${selectedBar ? selectedBar.type : ''}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up event listeners for the component
     */
    setupEventListeners() {
        // Get the bar select element
        const barSelect = document.getElementById('barSelect');
        if (!barSelect) return;
        
        // Add change event listener
        barSelect.addEventListener('change', (e) => {
            const barId = e.target.value;
            if (!barId) {
                // No bar selected
                barService.setSelectedBar(null);
                this.updateBarDetails(null);
                return;
            }
            
            // Find the selected bar
            const bar = barService.getBars().find(b => b.id === barId);
            if (bar) {
                barService.setSelectedBar(bar);
                this.updateBarDetails(bar);
                
                // Call the callback if provided
                if (this.onBarSelected) {
                    this.onBarSelected(bar);
                }
            }
        });
    }
    
    /**
     * Update the bar details display
     * @param {Object|null} bar - The selected bar or null if none selected
     */
    updateBarDetails(bar) {
        const barDetails = document.getElementById('barDetails');
        if (!barDetails) return;
        
        if (!bar) {
            barDetails.style.display = 'none';
            return;
        }
        
        // Update the bar details
        barDetails.style.display = 'block';
        barDetails.innerHTML = `
            <div class="bar-name">${bar.name}</div>
            <div class="bar-location">${bar.location}</div>
            <div class="bar-type">${bar.type}</div>
        `;
    }
    
    /**
     * Get the currently selected bar
     * @returns {Object|null} - The selected bar or null if none selected
     */
    getSelectedBar() {
        return barService.getSelectedBar();
    }
}

export default BarSelector;
