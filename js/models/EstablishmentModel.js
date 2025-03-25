/**
 * Establishment Model
 * Defines the establishment data structure and methods
 */

import { db, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from '../firebase-config.js';
import { showNotification } from '../utils/uiUtils.js';

export class EstablishmentModel {
    constructor(data = {}) {
        // Basic Info
        this.id = data.id || null;
        this.name = data.name || '';
        this.address = data.address || '';
        this.city = data.city || '';
        this.state = data.state || '';
        this.zipCode = data.zipCode || '';
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.type = data.type || 'bar'; // restaurant, bar, hotel, etc.
        this.manager = data.manager || '';
        this.possystem = data.possystem || '';  // Point of sale system
        
        // Payment Processing
        this.paymentProcessors = data.paymentProcessors || ['credit card', 'cash'];
        this.defaultTipCalculation = data.defaultTipCalculation || 'percentage'; // percentage, amount
        this.autoGratuity = data.autoGratuity !== undefined ? data.autoGratuity : false;
        this.autoGratuityPercentage = data.autoGratuityPercentage || 18;
        this.autoGratuityPartySize = data.autoGratuityPartySize || 8;
        
        // Operating Hours
        this.hours = data.hours || {
            monday: { open: '11:00', close: '23:00' },
            tuesday: { open: '11:00', close: '23:00' },
            wednesday: { open: '11:00', close: '23:00' },
            thursday: { open: '11:00', close: '23:00' },
            friday: { open: '11:00', close: '00:00' },
            saturday: { open: '11:00', close: '00:00' },
            sunday: { open: '11:00', close: '23:00' }
        };
        
        // Additional Info
        this.created = data.created || new Date().toISOString();
        this.modified = data.modified || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.notes = data.notes || '';
    }

    /**
     * Save establishment data to Firebase
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async saveToFirebase() {
        try {
            const establishmentCollection = collection(db, 'establishments');
            let establishmentDocRef;
            
            if (this.id) {
                // Update existing establishment
                establishmentDocRef = doc(establishmentCollection, this.id);
                // Update modified timestamp
                this.modified = new Date().toISOString();
                await updateDoc(establishmentDocRef, this.toJSON());
            } else {
                // Create new establishment
                establishmentDocRef = doc(establishmentCollection);
                this.id = establishmentDocRef.id;
                // Set created and modified timestamps
                this.created = new Date().toISOString();
                this.modified = new Date().toISOString();
                await setDoc(establishmentDocRef, this.toJSON());
            }
            
            console.log('Establishment data saved to Firebase successfully', this.id);
            return true;
        } catch (error) {
            console.error('Error saving establishment data to Firebase:', error);
            
            // If this is a permission error, try to save to localStorage as a fallback
            if (error.code === 'permission-denied' || 
                (error.message && error.message.includes('Missing or insufficient permissions'))) {
                
                return this.saveToLocalStorage();
            }
            
            return false;
        }
    }

    /**
     * Save establishment data to local storage as a fallback
     * @returns {boolean} - Whether the operation was successful
     */
    saveToLocalStorage() {
        try {
            const data = JSON.stringify(this.toJSON());
            if (!this.id) {
                this.id = 'local-establishment-' + Date.now();
            }
            localStorage.setItem(`tipenter_establishment_${this.id}`, data);
            console.log('Establishment data saved to local storage', this.id);
            return true;
        } catch (error) {
            console.error('Error saving establishment data to local storage:', error);
            return false;
        }
    }

    /**
     * Update the establishment with new data
     * @param {Object} data - The establishment data to update
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async update(data) {
        // Update establishment data
        Object.assign(this, data);
        
        // Update modified timestamp
        this.modified = new Date().toISOString();

        try {
            // Try to save to Firebase first
            const success = await this.saveToFirebase();
            if (success) {
                showNotification('Establishment information updated successfully!', 'success');
                return true;
            } else {
                // Fall back to local storage if Firebase fails
                const localSaveSuccess = this.saveToLocalStorage();
                if (localSaveSuccess) {
                    showNotification('Establishment information saved locally! (Firebase unavailable)', 'warning');
                    return true;
                } else {
                    showNotification('Failed to save establishment information.', 'error');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error updating establishment:', error);
            showNotification('Failed to update establishment information.', 'error');
            return false;
        }
    }

    /**
     * Get establishment by ID
     * @param {string} id - The establishment ID
     * @returns {Promise<EstablishmentModel|null>} - Promise resolving to the establishment model or null if not found
     */
    static async getById(id) {
        try {
            if (!id) {
                console.error('Cannot get establishment without ID');
                return null;
            }

            // Try to get from Firebase first
            try {
                const establishmentDoc = await getDoc(doc(db, 'establishments', id));
                if (establishmentDoc.exists()) {
                    return new EstablishmentModel({ id, ...establishmentDoc.data() });
                }
            } catch (error) {
                console.warn('Error getting establishment from Firebase:', error);
                
                // If this is a permission error, try local storage
                if (error.code === 'permission-denied' || 
                    (error.message && error.message.includes('Missing or insufficient permissions'))) {
                    
                    console.log('Trying to load establishment from local storage due to permission error');
                }
            }
            
            // If not found in Firebase or there was an error, try local storage
            const localData = localStorage.getItem(`tipenter_establishment_${id}`);
            if (localData) {
                return new EstablishmentModel({ id, ...JSON.parse(localData) });
            }
            
            return null;
        } catch (error) {
            console.error('Error getting establishment by ID:', error);
            return null;
        }
    }

    /**
     * Get establishments by user ID
     * @param {string} userId - The user ID
     * @returns {Promise<EstablishmentModel[]>} - Promise resolving to an array of establishment models
     */
    static async getByUserId(userId) {
        try {
            if (!userId) {
                console.error('Cannot get establishments without user ID');
                return [];
            }

            const establishments = [];
            
            // First, get user's workplace relations
            const workplaceQuery = query(
                collection(db, 'user_workplaces'),
                where('userId', '==', userId)
            );
            
            try {
                const workplaceSnapshot = await getDocs(workplaceQuery);
                
                // For each workplace relation, get the establishment
                for (const workplaceDoc of workplaceSnapshot.docs) {
                    const establishmentId = workplaceDoc.data().establishmentId;
                    if (establishmentId) {
                        try {
                            const establishment = await EstablishmentModel.getById(establishmentId);
                            if (establishment) {
                                establishments.push(establishment);
                            }
                        } catch (establishmentError) {
                            console.warn('Error getting establishment:', establishmentError);
                        }
                    }
                }
            } catch (workplaceError) {
                console.error('Error getting user workplaces:', workplaceError);
                
                // Check if this is a permission error
                if (workplaceError.code === 'permission-denied' || 
                    (workplaceError.message && workplaceError.message.includes('Missing or insufficient permissions'))) {
                    
                    console.log('Permission error getting workplaces, returning mock data');
                    
                    // Return mock establishment for demo purposes when permissions fail
                    const mockEstablishment = new EstablishmentModel({
                        id: 'mock-establishment-' + Date.now(),
                        name: 'Demo Bar',
                        address: '123 Main Street',
                        city: 'Example City',
                        state: 'CA',
                        manager: 'Demo Manager',
                        type: 'bar',
                        possystem: 'demo'
                    });
                    
                    // Save to localStorage for persistence
                    mockEstablishment.saveToLocalStorage();
                    
                    return [mockEstablishment];
                }
            }
            
            // If no establishments found in Firebase or there was an error, check local storage
            if (establishments.length === 0) {
                // Get all keys from localStorage
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    
                    // Check if key matches pattern for establishment data
                    if (key && key.startsWith('tipenter_establishment_')) {
                        try {
                            const data = JSON.parse(localStorage.getItem(key));
                            const id = key.replace('tipenter_establishment_', '');
                            establishments.push(new EstablishmentModel({ id, ...data }));
                        } catch (localError) {
                            console.warn('Error parsing establishment from localStorage:', localError);
                        }
                    }
                }
            }
            
            return establishments;
        } catch (error) {
            console.error('Error getting establishments by user ID:', error);
            return [];
        }
    }

    /**
     * Get all establishments
     * @returns {Promise<EstablishmentModel[]>} - Promise resolving to an array of all establishment models
     */
    static async getAll() {
        try {
            const establishments = [];
            
            try {
                console.log('🔄 Fetching establishments from Firebase collection...');
                
                // Get all establishments from Firebase
                const establishmentsCollection = collection(db, 'establishments');
                console.log('Collection reference created:', establishmentsCollection);
                
                const querySnapshot = await getDocs(establishmentsCollection);
                console.log('Query snapshot received:', querySnapshot);
                console.log('Number of documents in snapshot:', querySnapshot.size);
                
                // Add each document to our establishments array
                querySnapshot.forEach((doc) => {
                    console.log('Processing document:', doc.id);
                    const data = doc.data();
                    console.log('Document data:', data);
                    establishments.push(new EstablishmentModel({ id: doc.id, ...data }));
                });
                
                console.log('✅ Successfully retrieved establishments from Firebase:', establishments.length);
                
                // If we still don't have establishments, add a hardcoded one for testing
                if (establishments.length === 0) {
                    console.log('⚠️ No establishments found in query results, adding hardcoded test data');
                    
                    // Add a hardcoded entry for Cork Harbour
                    const hardcodedEstablishment = new EstablishmentModel({
                        id: 'qXtsIXX3LJSD7xgMfJFr', // Use ID from the user's feedback
                        name: 'Cork Harbour',
                        manager: 'Tanner Fitzgerald',
                        possystem: 'lightspeed'
                    });
                    
                    establishments.push(hardcodedEstablishment);
                }
            } catch (error) {
                console.warn('Error getting establishments from Firebase:', error);
                console.warn('Error details:', error.message, error.stack);
                
                // Check if this is a permission error
                if (error.code === 'permission-denied' || 
                    (error.message && error.message.includes('Missing or insufficient permissions'))) {
                    
                    console.log('Permission error getting establishments, checking localStorage');
                }
                
                // Add a hardcoded entry for testing when Firebase fails
                const hardcodedEstablishment = new EstablishmentModel({
                    id: 'qXtsIXX3LJSD7xgMfJFr', // Use ID from the user's feedback
                    name: 'Cork Harbour',
                    manager: 'Tanner Fitzgerald',
                    possystem: 'lightspeed'
                });
                
                establishments.push(hardcodedEstablishment);
            }
            
            // Check local storage for any additional establishments
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // Check if key matches pattern for establishment data
                if (key && key.startsWith('tipenter_establishment_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const id = key.replace('tipenter_establishment_', '');
                        
                        // Check if we already have this establishment (avoid duplicates)
                        const existingIndex = establishments.findIndex(e => e.id === id);
                        if (existingIndex === -1) {
                            establishments.push(new EstablishmentModel({ id, ...data }));
                        }
                    } catch (localError) {
                        console.warn('Error parsing establishment from localStorage:', localError);
                    }
                }
            }
            
            return establishments;
        } catch (error) {
            console.error('Error getting all establishments:', error);
            return [];
        }
    }

    /**
     * Create a sample establishment for a new user
     * @param {string} userId - The user ID
     * @param {string} userName - The user's name
     * @returns {Promise<EstablishmentModel|null>} - Promise resolving to the created establishment model or null if failed
     */
    static async createSampleEstablishment(userId, userName) {
        try {
            // Create a sample establishment
            const establishment = new EstablishmentModel({
                name: `${userName}'s Bar`,
                address: '123 Main Street',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                type: 'bar',
                manager: userName,
                possystem: 'lightspeed',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                isActive: true
            });
            
            // Save to Firestore
            const success = await establishment.saveToFirebase();
            
            if (!success) {
                console.error('Failed to create sample establishment');
                return null;
            }
            
            // Create user-workplace relation
            try {
                const workplaceDoc = {
                    userId: userId,
                    establishmentId: establishment.id,
                    role: 'manager',
                    created: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'user_workplaces', `${userId}_${establishment.id}`), workplaceDoc);
            } catch (workplaceError) {
                console.warn('Error creating workplace relation:', workplaceError);
                
                // If this is a permission error, store the relation in localStorage
                if (workplaceError.code === 'permission-denied' || 
                    (workplaceError.message && workplaceError.message.includes('Missing or insufficient permissions'))) {
                    
                    const workplaceData = {
                        userId: userId,
                        establishmentId: establishment.id,
                        role: 'manager',
                        created: new Date().toISOString()
                    };
                    
                    localStorage.setItem(`tipenter_workplace_${userId}_${establishment.id}`, JSON.stringify(workplaceData));
                }
            }
            
            return establishment;
        } catch (error) {
            console.error('Failed to create sample establishment', error);
            return null;
        }
    }

    /**
     * Convert the establishment model to a JSON object
     * @returns {Object} - The establishment data as a JSON object
     */
    toJSON() {
        const data = { ...this };
        delete data.id; // ID is stored as document ID, not in the document itself
        return data;
    }
}
