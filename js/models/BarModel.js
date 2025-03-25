/**
 * Bar Model
 * Defines the bar establishment data structure and methods for bars specifically
 */

import { db, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, addDoc } from '../firebase-config.js';
import { showNotification } from '../utils/uiUtils.js';

export class BarModel {
    constructor(data = {}) {
        // Basic Info
        this.id = data.id || null;
        this.name = data.name || '';
        this.type = data.type || 'bar'; // pub, bar, nightclub, cocktail bar, sports bar, etc.
        this.location = data.location || {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            coordinates: {
                latitude: null,
                longitude: null
            }
        };
        this.contact = data.contact || {
            phone: '',
            email: '',
            website: ''
        };
        
        // Business Info
        this.businessHours = data.businessHours || {
            monday: { open: "16:00", close: "02:00" }, // Default bar hours
            tuesday: { open: "16:00", close: "02:00" },
            wednesday: { open: "16:00", close: "02:00" },
            thursday: { open: "16:00", close: "02:00" },
            friday: { open: "16:00", close: "02:00" },
            saturday: { open: "16:00", close: "02:00" },
            sunday: { open: "16:00", close: "02:00" }
        };
        this.posSystem = data.posSystem || '';
        this.posSystemDetails = data.posSystemDetails || {
            version: '',
            apiKey: '',
            lastSync: null
        };
        
        // Bar-Specific Info
        this.barDetails = data.barDetails || {
            hasKitchen: false,
            liveMusic: false,
            happyHourTimes: {
                monday: { start: "16:00", end: "19:00" },
                tuesday: { start: "16:00", end: "19:00" },
                wednesday: { start: "16:00", end: "19:00" },
                thursday: { start: "16:00", end: "19:00" },
                friday: { start: "16:00", end: "19:00" },
                saturday: null,
                sunday: null
            },
            specialties: [], // Signature drinks, etc.
            amenities: [], // Pool tables, darts, etc.
        };
        
        // Tip Management System Details
        this.tipPoolingMethod = data.tipPoolingMethod || 'equal'; // equal, weighted, hourly, etc.
        this.tipPoolingDetails = data.tipPoolingDetails || {
            includeBussers: false,
            includeHost: false,
            includeKitchen: false,
            barbackPercentage: 0.15, // 15% to barbacks
            weightedRules: {} // For custom weighted distributions
        };
        this.scannerID = data.scannerID || null;
        this.subscriptionTier = data.subscriptionTier || 'FREE';
        this.subscriptionDetails = data.subscriptionDetails || {
            startDate: new Date().toISOString().split('T')[0],
            renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            scanCredits: 15,
            usedScans: 0,
            autoRenew: true
        };
        
        // Staff Management
        this.owner = data.owner || {
            userId: null,
            name: '',
            email: '',
            phone: ''
        };
        this.manager = data.manager || {
            userId: null,
            name: '',
            email: '',
            phone: '',
            role: 'Bar Manager'
        };
        
        // Bar Staff - specific to bars
        this.bartenders = data.bartenders || [];
        this.barbacks = data.barbacks || [];
        
        // Metadata
        this.created = data.created || new Date().toISOString();
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
    }

    /**
     * Save bar data to Firebase
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async saveToFirebase() {
        try {
            const barsCollection = collection(db, 'bars');
            let docRef;
            
            if (this.id) {
                // Update existing bar
                docRef = doc(barsCollection, this.id);
                await updateDoc(docRef, this.toJSON());
            } else {
                // Create new bar
                docRef = doc(barsCollection);
                this.id = docRef.id;
                await setDoc(docRef, this.toJSON());
            }
            
            console.log('Bar data saved to Firebase successfully', this.id);
            return true;
        } catch (error) {
            console.error('Error saving bar data to Firebase:', error);
            return false;
        }
    }

    /**
     * Save bar data to local storage as a fallback
     * @returns {boolean} - Whether the operation was successful
     */
    saveToLocalStorage() {
        try {
            const data = JSON.stringify(this.toJSON());
            localStorage.setItem(`tipenter_bar_${this.id || 'new'}`, data);
            console.log('Bar data saved to local storage');
            return true;
        } catch (error) {
            console.error('Error saving bar data to local storage:', error);
            return false;
        }
    }

    /**
     * Update the bar with new data
     * @param {Object} data - The bar data to update
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async update(data) {
        // Update bar data
        Object.assign(this, data);
        this.lastUpdated = new Date().toISOString();

        try {
            // Try to save to Firebase first
            const success = await this.saveToFirebase();
            if (success) {
                showNotification('Bar updated successfully!', 'success');
                return true;
            } else {
                // Fall back to local storage if Firebase fails
                const localSaveSuccess = this.saveToLocalStorage();
                if (localSaveSuccess) {
                    showNotification('Bar saved locally! (Firebase unavailable)', 'warning');
                    return true;
                } else {
                    showNotification('Failed to save bar data.', 'error');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error updating bar:', error);
            showNotification('Failed to update bar.', 'error');
            return false;
        }
    }

    /**
     * Get bar by ID
     * @param {string} id - The bar ID
     * @returns {Promise<BarModel|null>} - Promise resolving to the bar model or null if not found
     */
    static async getById(id) {
        try {
            const docRef = doc(db, 'bars', id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return new BarModel({ id: docSnap.id, ...docSnap.data() });
            }
            
            // Try loading from local storage if not found in Firebase
            const localData = localStorage.getItem(`tipenter_bar_${id}`);
            if (localData) {
                return new BarModel({ id, ...JSON.parse(localData) });
            }
            
            return null;
        } catch (error) {
            console.error('Error getting bar by ID:', error);
            
            // Try loading from local storage as fallback
            try {
                const localData = localStorage.getItem(`tipenter_bar_${id}`);
                if (localData) {
                    return new BarModel({ id, ...JSON.parse(localData) });
                }
            } catch (localError) {
                console.error('Error loading from local storage:', localError);
            }
            
            return null;
        }
    }

    /**
     * Get bars by owner ID
     * @param {string} ownerId - The owner user ID
     * @returns {Promise<BarModel[]>} - Promise resolving to an array of bar models
     */
    static async getByOwnerId(ownerId) {
        try {
            const barsQuery = query(
                collection(db, 'bars'),
                where('owner.userId', '==', ownerId)
            );
            
            const querySnapshot = await getDocs(barsQuery);
            const bars = [];
            
            querySnapshot.forEach((doc) => {
                bars.push(new BarModel({ id: doc.id, ...doc.data() }));
            });
            
            return bars;
        } catch (error) {
            console.error('Error getting bars by owner ID:', error);
            return [];
        }
    }

    /**
     * Get all active bars
     * @returns {Promise<BarModel[]>} - Promise resolving to an array of active bar models
     */
    static async getAllActive() {
        try {
            const barsQuery = query(
                collection(db, 'bars'),
                where('isActive', '==', true)
            );
            
            const querySnapshot = await getDocs(barsQuery);
            const bars = [];
            
            querySnapshot.forEach((doc) => {
                bars.push(new BarModel({ id: doc.id, ...doc.data() }));
            });
            
            return bars;
        } catch (error) {
            console.error('Error getting active bars:', error);
            return [];
        }
    }

    /**
     * Add a staff member to the bar
     * @param {string} userId - The user ID of the staff member
     * @param {string} name - The name of the staff member
     * @param {string} role - The role of the staff member (bartender, barback, etc.)
     * @param {Object} details - Additional details about the staff member
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async addStaffMember(userId, name, role, details = {}) {
        try {
            // Create staff document in the staff collection
            const staffData = {
                userId: userId,
                barId: this.id,
                name: name,
                role: role.toLowerCase(),
                hireDate: new Date().toISOString(),
                isActive: true,
                tipPool: true,
                ...details
            };
            
            // Add to appropriate collection based on role
            let collectionPath;
            if (role.toLowerCase() === 'bartender') {
                collectionPath = `bars/${this.id}/bartenders`;
                
                // Also add to bartenders array in the bar document
                if (!this.bartenders.some(b => b.userId === userId)) {
                    this.bartenders.push({
                        userId: userId,
                        name: name,
                        tipMultiplier: details.tipMultiplier || 1.0,
                        specialties: details.specialties || [],
                        certified: details.certified || false
                    });
                    
                    // Update the bar document
                    await this.update({ bartenders: this.bartenders });
                }
            } else if (role.toLowerCase() === 'barback') {
                collectionPath = `bars/${this.id}/barbacks`;
                
                // Also add to barbacks array in the bar document
                if (!this.barbacks.some(b => b.userId === userId)) {
                    this.barbacks.push({
                        userId: userId,
                        name: name,
                        tipPercentage: details.tipPercentage || 0.15,
                        responsibilities: details.responsibilities || []
                    });
                    
                    // Update the bar document
                    await this.update({ barbacks: this.barbacks });
                }
            } else {
                // Generic staff collection
                collectionPath = `bars/${this.id}/staff`;
            }
            
            // Add to the appropriate collection
            const staffRef = doc(collection(db, collectionPath));
            await setDoc(staffRef, staffData);
            
            // Create user-bar association
            await this.associateUserWithBar(userId, role.toLowerCase());
            
            return true;
        } catch (error) {
            console.error('Error adding staff member:', error);
            return false;
        }
    }
    
    /**
     * Create user-bar association in Firebase
     * @param {string} userId - The user ID
     * @param {string} role - The user's role (bartender, manager, etc.)
     * @returns {Promise<void>}
     */
    async associateUserWithBar(userId, role) {
        try {
            const association = {
                user_id: userId,
                bar_id: this.id,
                role: role,
                created_at: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'user_bars', `${userId}_${this.id}`), association);
            console.log(`User ${userId} associated with bar ${this.id} as ${role}`);
        } catch (error) {
            console.error('Error associating user with bar:', error);
            throw error;
        }
    }
    
    /**
     * Create a sample bar with a manager and bartender
     * @param {string} name - The name of the bar
     * @param {string} location - The location of the bar
     * @param {string} type - The type of bar
     * @returns {Promise<BarModel>} - Promise resolving to the created bar
     */
    static async createSampleBar(name, location, type = 'bar') {
        // Create a new bar
        const bar = new BarModel({
            name: name,
            type: type,
            location: typeof location === 'string' 
                ? { address: location, city: location.split(',')[0], state: location.split(',')[1]?.trim() || '' }
                : location,
            posSystem: "Toast", // Default POS system
            barDetails: {
                hasKitchen: true,
                liveMusic: false,
                specialties: ["Craft Cocktails", "Local Beers"],
                amenities: ["Bar Games", "TVs"]
            },
            manager: {
                name: "Alex Smith",
                email: "alex@example.com",
                phone: "412-555-8765"
            }
        });
        
        // Save to Firebase
        const success = await bar.saveToFirebase();
        
        if (success) {
            console.log(`Sample bar ${name} created successfully:`, bar.id);
            
            // Add a demo bartender
            const bartenderId = `user_demo_bartender_${bar.id}`;
            const bartenderName = "Sam Wilson";
            
            await bar.addStaffMember(
                bartenderId, 
                bartenderName, 
                "Bartender",
                {
                    tipMultiplier: 1.0,
                    specialties: ["Mixology", "Craft Beer"],
                    certified: true,
                    email: "sam@example.com",
                    phone: "412-555-1234"
                }
            );
        } else {
            console.error(`Failed to create sample bar ${name}`);
        }
        
        return bar;
    }

    /**
     * Convert the bar model to a JSON object
     * @returns {Object} - The bar data as a JSON object
     */
    toJSON() {
        const data = { ...this };
        delete data.id; // ID is stored as document ID, not in the document itself
        data.lastUpdated = new Date().toISOString(); // Always update timestamp
        return data;
    }
}
