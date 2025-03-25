/**
 * Staff Model
 * Defines the staff member data structure and methods
 */

import { db, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from '../firebase-config.js';
import { showNotification } from '../utils/uiUtils.js';

export class StaffModel {
    constructor(data = {}) {
        // Basic Info
        this.id = data.id || null;
        this.userId = data.userId || null;
        this.establishmentId = data.establishmentId || null;
        this.name = data.name || '';
        this.role = data.role || 'Bartender'; // Bartender, Server, Host, etc.
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.hireDate = data.hireDate || new Date().toISOString();
        this.scheduleId = data.scheduleId || null;
        this.permissions = data.permissions || ["view_reports", "process_receipts"];
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.tipPool = data.tipPool !== undefined ? data.tipPool : true;
        this.notes = data.notes || '';
        
        // Bartender-specific properties (only if role is Bartender)
        this.bartenderInfo = data.bartenderInfo || null;
        
        // If role is Bartender and no bartenderInfo, initialize it
        if (this.role.toLowerCase() === 'bartender' && !this.bartenderInfo) {
            this.bartenderInfo = {
                shifts: [],
                tipRate: 1.0,
                specialties: [],
                certified: false
            };
        }
    }

    /**
     * Save staff data to Firebase
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async saveToFirebase() {
        try {
            // Save to staff collection
            const staffCollection = collection(db, 'staff');
            let staffDocRef;
            
            if (this.id) {
                // Update existing staff
                staffDocRef = doc(staffCollection, this.id);
                const staffData = this.toJSON();
                delete staffData.bartenderInfo; // Don't store bartender info in staff collection
                await updateDoc(staffDocRef, staffData);
            } else {
                // Create new staff
                staffDocRef = doc(staffCollection);
                this.id = staffDocRef.id;
                const staffData = this.toJSON();
                delete staffData.bartenderInfo; // Don't store bartender info in staff collection
                await setDoc(staffDocRef, staffData);
            }
            
            // If bartender, also save to bartenders subcollection
            if (this.role.toLowerCase() === 'bartender' && this.bartenderInfo && this.establishmentId) {
                const bartendersCollection = collection(db, `establishments/${this.establishmentId}/bartenders`);
                const bartenderDocRef = doc(bartendersCollection, this.id);
                
                const bartenderData = {
                    staffId: this.id,
                    name: this.name,
                    shifts: this.bartenderInfo.shifts || [],
                    tipRate: this.bartenderInfo.tipRate || 1.0,
                    specialties: this.bartenderInfo.specialties || [],
                    certified: this.bartenderInfo.certified || false
                };
                
                await setDoc(bartenderDocRef, bartenderData);
            }
            
            console.log('Staff data saved to Firebase successfully', this.id);
            return true;
        } catch (error) {
            console.error('Error saving staff data to Firebase:', error);
            return false;
        }
    }

    /**
     * Save staff data to local storage as a fallback
     * @returns {boolean} - Whether the operation was successful
     */
    saveToLocalStorage() {
        try {
            const data = JSON.stringify(this.toJSON());
            localStorage.setItem(`tipenter_staff_${this.id || 'new'}`, data);
            console.log('Staff data saved to local storage');
            return true;
        } catch (error) {
            console.error('Error saving staff data to local storage:', error);
            return false;
        }
    }

    /**
     * Update the staff member with new data
     * @param {Object} data - The staff data to update
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async update(data) {
        // Update staff data
        Object.assign(this, data);

        try {
            // Try to save to Firebase first
            const success = await this.saveToFirebase();
            if (success) {
                showNotification('Staff information updated successfully!', 'success');
                return true;
            } else {
                // Fall back to local storage if Firebase fails
                const localSaveSuccess = this.saveToLocalStorage();
                if (localSaveSuccess) {
                    showNotification('Staff information saved locally! (Firebase unavailable)', 'warning');
                    return true;
                } else {
                    showNotification('Failed to save staff information.', 'error');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error updating staff member:', error);
            showNotification('Failed to update staff information.', 'error');
            return false;
        }
    }

    /**
     * Get staff by ID
     * @param {string} id - The staff ID
     * @returns {Promise<StaffModel|null>} - Promise resolving to the staff model or null if not found
     */
    static async getById(id) {
        try {
            if (!id) {
                console.error('Cannot get staff without ID');
                return null;
            }

            // Get staff document
            const staffDoc = await getDoc(doc(db, 'staff', id));
            if (staffDoc.exists()) {
                const staffData = { id, ...staffDoc.data() };
                
                // If it's a bartender, get bartender information
                if (staffData.role.toLowerCase() === 'bartender' && staffData.establishmentId) {
                    try {
                        const bartenderRef = doc(db, `establishments/${staffData.establishmentId}/bartenders`, id);
                        const bartenderSnap = await getDoc(bartenderRef);
                        
                        if (bartenderSnap.exists()) {
                            staffData.bartenderInfo = {
                                shifts: bartenderSnap.data().shifts || [],
                                tipRate: bartenderSnap.data().tipRate || 1.0,
                                specialties: bartenderSnap.data().specialties || [],
                                certified: bartenderSnap.data().certified || false
                            };
                        }
                    } catch (bartenderError) {
                        console.warn('Error fetching bartender info:', bartenderError);
                    }
                }
                
                return new StaffModel(staffData);
            }
            
            // Try loading from local storage if not found in Firebase
            const localData = localStorage.getItem(`tipenter_staff_${id}`);
            if (localData) {
                return new StaffModel({ id, ...JSON.parse(localData) });
            }
            
            return null;
        } catch (error) {
            console.error('Error getting staff by ID:', error);
            
            // Try loading from local storage as fallback
            try {
                const localData = localStorage.getItem(`tipenter_staff_${id}`);
                if (localData) {
                    return new StaffModel({ id, ...JSON.parse(localData) });
                }
            } catch (localError) {
                console.error('Error loading from local storage:', localError);
            }
            
            return null;
        }
    }

    /**
     * Get staff by user ID
     * @param {string} userId - The user ID
     * @returns {Promise<Array<StaffModel>>} - Promise resolving to an array of staff models
     */
    static async getByUserId(userId) {
        try {
            if (!userId) {
                console.error('Cannot get staff without user ID');
                return [];
            }

            // Query staff collection where userId field matches
            const q = query(collection(db, 'staff'), where('userId', '==', userId));
            
            try {
                const querySnapshot = await getDocs(q);
                
                const staffList = [];
                querySnapshot.forEach((doc) => {
                    staffList.push(new StaffModel({ id: doc.id, ...doc.data() }));
                });
                
                return staffList;
            } catch (firestoreError) {
                console.error('Error getting staff by user ID:', firestoreError);
                
                // If this is a permission error, return a mock staff member
                if (firestoreError.code === 'permission-denied' || 
                    (firestoreError.message && firestoreError.message.includes('Missing or insufficient permissions'))) {
                    
                    console.log('Creating mock staff member due to permission error');
                    
                    // Return a mock staff member for now to prevent application errors
                    const mockStaff = new StaffModel({
                        id: 'mock-staff-' + Date.now(),
                        userId: userId,
                        establishmentId: 'mock-establishment',
                        name: 'Demo Staff Member',
                        role: 'bartender',
                        position: 'Bartender',
                        isActive: true,
                        created: new Date().toISOString()
                    });
                    
                    // Try to save to localStorage as a fallback
                    try {
                        localStorage.setItem('tipenter_mock_staff_' + userId, JSON.stringify(mockStaff.toJSON()));
                    } catch (e) {
                        console.warn('Could not save mock staff to localStorage:', e);
                    }
                    
                    return [mockStaff];
                }
                
                // For other errors, return empty array
                return [];
            }
        } catch (error) {
            console.error('Error in getByUserId:', error);
            return [];
        }
    }

    /**
     * Get staff by establishment ID
     * @param {string} establishmentId - The establishment ID
     * @returns {Promise<StaffModel[]>} - Promise resolving to an array of staff models
     */
    static async getByEstablishment(establishmentId) {
        try {
            const staffQuery = query(
                collection(db, 'staff'),
                where('establishmentId', '==', establishmentId)
            );
            
            const querySnapshot = await getDocs(staffQuery);
            const staffMembers = [];
            
            // Process each staff member
            for (const doc of querySnapshot.docs) {
                const staffData = { id: doc.id, ...doc.data() };
                
                // If it's a bartender, get bartender information
                if (staffData.role.toLowerCase() === 'bartender') {
                    try {
                        const bartenderRef = doc(db, `establishments/${establishmentId}/bartenders`, doc.id);
                        const bartenderSnap = await getDoc(bartenderRef);
                        
                        if (bartenderSnap.exists()) {
                            staffData.bartenderInfo = {
                                shifts: bartenderSnap.data().shifts || [],
                                tipRate: bartenderSnap.data().tipRate || 1.0,
                                specialties: bartenderSnap.data().specialties || [],
                                certified: bartenderSnap.data().certified || false
                            };
                        }
                    } catch (bartenderError) {
                        console.warn('Error fetching bartender info:', bartenderError);
                    }
                }
                
                staffMembers.push(new StaffModel(staffData));
            }
            
            return staffMembers;
        } catch (error) {
            console.error('Error getting staff by establishment ID:', error);
            return [];
        }
    }

    /**
     * Get bartenders by establishment ID
     * @param {string} establishmentId - The establishment ID
     * @returns {Promise<StaffModel[]>} - Promise resolving to an array of bartender staff models
     */
    static async getBartendersByEstablishment(establishmentId) {
        try {
            const staffQuery = query(
                collection(db, 'staff'),
                where('establishmentId', '==', establishmentId),
                where('role', '==', 'Bartender')
            );
            
            const querySnapshot = await getDocs(staffQuery);
            const bartenders = [];
            
            // Process each bartender
            for (const doc of querySnapshot.docs) {
                const staffData = { id: doc.id, ...doc.data() };
                
                // Get bartender information
                try {
                    const bartenderRef = doc(db, `establishments/${establishmentId}/bartenders`, doc.id);
                    const bartenderSnap = await getDoc(bartenderRef);
                    
                    if (bartenderSnap.exists()) {
                        staffData.bartenderInfo = {
                            shifts: bartenderSnap.data().shifts || [],
                            tipRate: bartenderSnap.data().tipRate || 1.0,
                            specialties: bartenderSnap.data().specialties || [],
                            certified: bartenderSnap.data().certified || false
                        };
                    }
                } catch (bartenderError) {
                    console.warn('Error fetching bartender info:', bartenderError);
                }
                
                bartenders.push(new StaffModel(staffData));
            }
            
            return bartenders;
        } catch (error) {
            console.error('Error getting bartenders by establishment ID:', error);
            return [];
        }
    }

    /**
     * Create a new staff member
     * @param {string} establishmentId - The establishment ID
     * @param {Object} userData - The user data
     * @param {string} role - The staff role
     * @param {Object} additionalData - Additional staff data
     * @returns {Promise<StaffModel|null>} - Promise resolving to the created staff model or null if failed
     */
    static async create(establishmentId, userData, role, additionalData = {}) {
        try {
            const staffData = {
                userId: userData.id,
                establishmentId: establishmentId,
                name: userData.name,
                role: role,
                email: userData.email,
                phone: userData.phone || '',
                hireDate: new Date().toISOString(),
                isActive: true,
                tipPool: true,
                ...additionalData
            };
            
            const staff = new StaffModel(staffData);
            const success = await staff.saveToFirebase();
            
            if (success) {
                return staff;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating staff member:', error);
            return null;
        }
    }

    /**
     * Convert the staff model to a JSON object
     * @returns {Object} - The staff data as a JSON object
     */
    toJSON() {
        const data = { ...this };
        delete data.id; // ID is stored as document ID, not in the document itself
        return data;
    }
}
