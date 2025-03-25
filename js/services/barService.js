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
            { 
                name: "Cork Harbour Pub", 
                location: "Pittsburgh, PA", 
                type: "Pub",
                pos_system: "Lightspeed",
                manager: "Tanner",
                staff: [
                    { name: "Jackson Fitzgerald", position: "Bartender", email: "jackson@example.com" }
                ],
                description: "Irish pub serving craft beers and traditional pub food",
                hours: "Mon-Fri: 3pm-2am, Sat-Sun: 12pm-2am"
            },
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
    
    /**
     * Create a user-bar association in Firebase
     * @param {string} userId - The user ID
     * @param {string} barId - The bar ID
     * @param {string} role - The user's role (bartender, manager, etc.)
     * @returns {Promise<void>}
     */
    async associateUserWithBar(userId, barId, role) {
        try {
            const association = {
                user_id: userId,
                bar_id: barId,
                role: role,
                created_at: new Date().toISOString()
            };
            
            await setDoc(doc(db, this.userBarsCollection, `${userId}_${barId}`), association);
            console.log(`User ${userId} associated with bar ${barId} as ${role}`);
        } catch (error) {
            console.error('Error associating user with bar:', error);
            throw error;
        }
    }
    
    /**
     * Get bar details including staff information
     * @param {string} barId - The bar ID
     * @returns {Promise<Object>} - Promise resolving to bar details
     */
    async getBarDetails(barId) {
        try {
            const barDoc = await getDoc(doc(db, this.barsCollection, barId));
            
            if (!barDoc.exists()) {
                throw new Error(`Bar with ID ${barId} not found`);
            }
            
            const barData = barDoc.data();
            
            // Get users associated with this bar
            const userBarsSnapshot = await getDocs(collection(db, this.userBarsCollection));
            const barStaff = [];
            
            userBarsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.bar_id === barId) {
                    barStaff.push({
                        id: data.user_id,
                        role: data.role
                    });
                }
            });
            
            return {
                id: barDoc.id,
                ...barData,
                staff: barStaff
            };
        } catch (error) {
            console.error('Error getting bar details:', error);
            throw error;
        }
    }
    
    /**
     * Reset the database with enhanced bar data
     * This function adds detailed information including POS systems and staff
     * @returns {Promise<void>}
     */
    async resetWithEnhancedData() {
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
            
            // Add detailed bar data
            const enhancedBars = [
                { 
                    name: "Cork Harbour Pub", 
                    location: "Pittsburgh, PA", 
                    type: "Pub",
                    pos_system: "Lightspeed",
                    manager: "Tanner",
                    phone: "412-555-1234",
                    address: "123 Butler St, Pittsburgh, PA 15201",
                    description: "Irish pub serving craft beers and traditional pub food",
                    hours: "Mon-Fri: 3pm-2am, Sat-Sun: 12pm-2am",
                    capacity: 120,
                    staff: [
                        { name: "Jackson Fitzgerald", position: "Bartender", email: "jackson@example.com" }
                    ]
                },
                { 
                    name: "Derby on Butler", 
                    location: "Pittsburgh, PA", 
                    type: "Bar",
                    pos_system: "Toast",
                    manager: "Sarah Johnson"
                },
                { 
                    name: "McFaddens", 
                    location: "Pittsburgh, PA", 
                    type: "Bar & Restaurant",
                    pos_system: "Square" 
                },
                { 
                    name: "Tequila Cowboy", 
                    location: "Pittsburgh, PA", 
                    type: "Bar",
                    pos_system: "Clover" 
                }
            ];
            
            // Add enhanced bars to Firebase
            for (const bar of enhancedBars) {
                const staffData = bar.staff ? [...bar.staff] : [];
                delete bar.staff; // Remove staff from bar object
                
                // Add the bar
                const barRef = await addDoc(collection(db, this.barsCollection), bar);
                
                // If there are staff members, create user-bar associations
                if (staffData.length > 0) {
                    for (const staff of staffData) {
                        // Create or update user document
                        const userDoc = {
                            name: staff.name,
                            email: staff.email || `${staff.name.toLowerCase().replace(' ', '.')}@example.com`,
                            position: staff.position,
                            created_at: new Date().toISOString()
                        };
                        
                        // Generate a deterministic user ID
                        const userId = `user_${staff.name.toLowerCase().replace(' ', '_')}`;
                        await setDoc(doc(db, 'users', userId), userDoc);
                        
                        // Create user-bar association
                        await this.associateUserWithBar(userId, barRef.id, staff.position.toLowerCase());
                    }
                }
                
                // Add manager if specified
                if (bar.manager) {
                    const managerId = `user_${bar.manager.toLowerCase().replace(' ', '_')}`;
                    const managerDoc = {
                        name: bar.manager,
                        email: `${bar.manager.toLowerCase().replace(' ', '.')}@example.com`,
                        position: 'Manager',
                        created_at: new Date().toISOString()
                    };
                    
                    await setDoc(doc(db, 'users', managerId), managerDoc);
                    await this.associateUserWithBar(managerId, barRef.id, 'manager');
                }
            }
            
            console.log('Enhanced bar data added successfully');
            
            // Reload bars
            await this.loadBars();
        } catch (error) {
            console.error('Error resetting with enhanced data:', error);
        }
    }
}

// Create and export a singleton instance
const barService = new BarService();
export default barService;
