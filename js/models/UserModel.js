/**
 * User Model
 * Defines the user data structure and methods for interacting with user data
 */

import { db, doc, setDoc, getDoc, updateDoc } from '../firebase-config.js';
import { showNotification } from '../utils/uiUtils.js';

export class UserModel {
    constructor(userData = {}) {
        this.id = userData.id || null;
        this.name = userData.name || '';
        this.email = userData.email || '';
        this.role = userData.role || 'bartender';
        this.workplaceId = userData.workplaceId || '';
        this.workplaceName = userData.workplaceName || '';
        this.position = userData.position || '';
        this.subscription_tier = userData.subscription_tier || 'free';
        this.created_at = userData.created_at || new Date().toISOString();
        this.last_login = userData.last_login || new Date().toISOString();
        this.is_active = userData.is_active !== undefined ? userData.is_active : true;
    }

    /**
     * Save user data to Firebase
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async saveToFirebase() {
        try {
            if (!this.id) {
                console.error('Cannot save user without ID');
                return false;
            }

            const userRef = doc(db, 'users', this.id);
            await setDoc(userRef, this.toJSON(), { merge: true });
            console.log('User data saved to Firebase successfully');
            return true;
        } catch (error) {
            console.error('Error saving user data to Firebase:', error);
            return false;
        }
    }

    /**
     * Save user data to local storage as a fallback
     * @returns {boolean} - Whether the operation was successful
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('tipenter_user_profile', JSON.stringify(this.toJSON()));
            console.log('User data saved to local storage successfully');
            return true;
        } catch (error) {
            console.error('Error saving user data to local storage:', error);
            return false;
        }
    }

    /**
     * Update the user profile with new data
     * @param {Object} userData - The user data to update
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async updateProfile(userData) {
        // Update properties
        Object.assign(this, userData);

        try {
            // Try to save to Firebase first
            if (this.id) {
                try {
                    console.log('Attempting to save profile to Firebase...');
                    
                    // Create a reference to the user document
                    const userRef = doc(db, 'users', this.id);
                    
                    // Use the userData directly to avoid any circular references
                    const userDataToSave = this.toJSON();
                    console.log('User data to save:', userDataToSave);
                    
                    try {
                        // Try to update the document
                        await updateDoc(userRef, userDataToSave);
                        console.log('Profile saved to Firebase successfully!');
                        showNotification('Profile updated successfully!', 'success');
                        return true;
                    } catch (updateError) {
                        // If there's a specific error with updateDoc, try setDoc instead
                        console.warn('Update operation failed, trying set operation instead', updateError);
                        
                        try {
                            await setDoc(userRef, userDataToSave, { merge: true });
                            console.log('Profile saved to Firebase successfully using set!');
                            showNotification('Profile updated successfully!', 'success');
                            return true;
                        } catch (setError) {
                            throw setError; // Pass to the outer catch
                        }
                    }
                } catch (firebaseError) {
                    console.warn('Firebase update failed, using local storage fallback', firebaseError);
                    
                    // Handle permission errors
                    if (firebaseError.code === 'permission-denied' || 
                        (firebaseError.message && firebaseError.message.includes('Missing or insufficient permissions'))) {
                        
                        console.log('Permission error detected, using local storage fallback');
                    }
                    
                    // Fall back to local storage
                    const saveResult = this.saveToLocalStorage();
                    if (saveResult) {
                        showNotification('Profile saved locally! (Firebase unavailable)', 'warning');
                        return true;
                    } else {
                        showNotification('Failed to save profile changes.', 'error');
                        return false;
                    }
                }
            } else {
                // No ID, save to local storage only
                console.log('No user ID found, saving profile to local storage only');
                const saveResult = this.saveToLocalStorage();
                if (saveResult) {
                    showNotification('Profile saved locally!', 'success');
                    return true;
                } else {
                    showNotification('Failed to save profile changes.', 'error');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to save profile changes.', 'error');
            
            // Last resort - try localStorage
            try {
                const saveResult = this.saveToLocalStorage();
                if (saveResult) {
                    showNotification('Profile saved locally as fallback!', 'warning');
                    return true;
                }
            } catch (localError) {
                console.error('Could not save to local storage either:', localError);
            }
            
            return false;
        }
    }

    /**
     * Load user data from local storage
     * @returns {UserModel|null} - The user model or null if not found
     */
    static loadFromLocalStorage() {
        try {
            const userData = localStorage.getItem('tipenter_user_profile');
            if (userData) {
                return new UserModel(JSON.parse(userData));
            }
            return null;
        } catch (error) {
            console.error('Error loading user data from local storage:', error);
            return null;
        }
    }

    /**
     * Load user data from Firebase
     * @param {string} userId - The user ID
     * @returns {Promise<UserModel|null>} - Promise resolving to the user model or null if not found
     */
    static async loadFromFirebase(userId) {
        try {
            if (!userId) {
                console.error('Cannot load user without ID');
                return null;
            }

            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return new UserModel({ id: userId, ...userDoc.data() });
            }
            return null;
        } catch (error) {
            console.error('Error loading user data from Firebase:', error);
            return null;
        }
    }

    /**
     * Convert the user model to a JSON object
     * @returns {Object} - The user data as a JSON object
     */
    toJSON() {
        return {
            name: this.name,
            email: this.email,
            role: this.role,
            workplaceId: this.workplaceId,
            workplaceName: this.workplaceName,
            position: this.position,
            subscription_tier: this.subscription_tier,
            created_at: this.created_at,
            last_login: this.last_login,
            is_active: this.is_active
        };
    }
}
