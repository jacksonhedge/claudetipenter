/**
 * Bar Service
 * 
 * This service handles the management of bar data, including fetching and storing
 * bar information in Firebase.
 */

import { db, collection, doc, setDoc, getDoc, getDocs, addDoc, deleteDoc } from '../firebase-config.js';

class BarService {
    constructor() {
        this.bars = [];
        this.selectedBar = null;
        this.barsCollection = 'bars';
        this.userBarsCollection = 'user_bars';
    }

    /**
     * Initialize the bar service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            await this.loadBars();
            // Load selected bar from local storage if available
            const savedBar = localStorage.getItem('tipenter_selected_bar');
            if (savedBar) {
                this.selectedBar = JSON.parse(savedBar);
            }
        } catch (error) {
            console.error('Error initializing bar service:', error);
        }
    }

    /**
     * Load the list of bars from Firebase
     * @returns {Promise<Array>} - Promise resolving to array of bars
     */
    async loadBars() {
        try {
            const barsSnapshot = await getDocs(collection(db, this.barsCollection));
            this.bars = [];
            
            barsSnapshot.forEach(doc => {
                const barData = doc.data();
                this.bars.push({
                    id: doc.id,
                    name: barData.name,
                    location: barData.location || '',
                    type: barData.type || 'Bar'
                });
            });
            
            // If no bars found, add some default ones
            if (this.bars.length === 0) {
                await this.addDefaultBars();
            }
            
            return this.bars;
        } catch (error) {
            console.error('Error loading bars:', error);
            // Return default bars if Firebase fails
            return this.getDefaultBars();
        }
    }

    /**
     * Get the list of bars
     * @returns {Array} - Array of bar objects
     */
    getBars() {
        return this.bars;
    }

    /**
     * Get the currently selected bar
     * @returns {Object|null} - Selected bar or null if none selected
     */
    getSelectedBar() {
        return this.selectedBar;
    }

    /**
     * Set the selected bar
     * @param {Object} bar - The bar to select
     */
    setSelectedBar(bar) {
        this.selectedBar = bar;
        // Save to local storage
        localStorage.setItem('tipenter_selected_bar', JSON.stringify(bar));
        
        // Dispatch an event that the bar was selected
        const event = new CustomEvent('barSelected', { detail: bar });
        document.dispatchEvent(event);
    }

    /**
     * Add a new bar to Firebase
     * @param {Object} bar - The bar to add
     * @returns {Promise<string>} - Promise resolving to the new bar ID
     */
    async addBar(bar) {
        try {
            const docRef = await addDoc(collection(db, this.barsCollection), bar);
            // Reload bars
            await this.loadBars();
            return docRef.id;
        } catch (error) {
            console.error('Error adding bar:', error);
            throw error;
        }
    }

    /**
     * Add default bars to Firebase
     * @returns {Promise<void>}
     */
    async addDefaultBars() {
        try {
            const defaultBars = this.getDefaultBars();
            
            for (const bar of defaultBars) {
                await addDoc(collection(db, this.barsCollection), bar);
            }
            
            // Reload bars
            await this.loadBars();
        } catch (error) {
            console.error('Error adding default bars:', error);
        }
    }
    
    /**
     * Reset bars in Firebase - clears existing bars and adds default ones
     * @returns {Promise<void>}
     */
    async resetBars() {
        try {
            // Get all existing bars
            const barsSnapshot = await getDocs(collection(db, this.barsCollection));
            
            // Delete all existing bars
            const deletePromises = [];
            barsSnapshot.forEach(document => {
                deletePromises.push(deleteDoc(doc(db, this.barsCollection, document.id)));
            });
            
            // Wait for all deletes to complete
            await Promise.all(deletePromises);
            
            // Add default bars
            await this.addDefaultBars();
            
            console.log('Bars reset successfully');
        } catch (error) {
            console.error('Error resetting bars:', error);
        }
    }

    /**
     * Get a list of default bars
     * @returns {Array} - Array of default bar objects
     */
    getDefaultBars() {
        return [
            { name: "Cork Harbour Pub", location: "Pittsburgh, PA", type: "Pub" },
            { name: "Derby on Butler", location: "Pittsburgh, PA", type: "Bar" },
            { name: "McFaddens", location: "Pittsburgh, PA", type: "Bar & Restaurant" },
            { name: "Tequila Cowboy", location: "Pittsburgh, PA", type: "Bar" },
            { name: "Pins South Side", location: "Pittsburgh, PA", type: "Bar & Bowling" },
            { name: "Mario's on Walnut", location: "Pittsburgh, PA", type: "Bar" },
            { name: "Mario's in Oakland", location: "Pittsburgh, PA", type: "Bar" },
            { name: "Mario's South Side", location: "Pittsburgh, PA", type: "Bar" },
            { name: "William Penn Tavern", location: "Pittsburgh, PA", type: "Tavern" },
            { name: "Froggy's", location: "Pittsburgh, PA", type: "Bar" }
        ];
    }
}

// Create and export a singleton instance
const barService = new BarService();
export default barService;
