/**
 * Models Index
 * Central export point for all data models
 */

import { UserModel } from './UserModel.js';
import { EstablishmentModel } from './EstablishmentModel.js';
import { StaffModel } from './StaffModel.js';

// Export all models
export {
    UserModel,
    EstablishmentModel,
    StaffModel
};

/**
 * Database initialization function
 * Sets up sample data if needed
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
    console.log('🔄 Initializing database...');
    
    try {
        // Check if we already have sample data in localStorage
        const hasInitialized = localStorage.getItem('tipenter_db_initialized');
        if (hasInitialized === 'true') {
            console.log('✅ Database already initialized');
            return;
        }
        
        // Create sample Cork Harbour Pub establishment
        console.log('🏢 Creating sample establishment: Cork Harbour Pub');
        const corkHarbourPub = await EstablishmentModel.createSampleEstablishment();
        
        if (corkHarbourPub && corkHarbourPub.id) {
            console.log(`✅ Sample establishment created with ID: ${corkHarbourPub.id}`);
            
            // Add Jackson as a bartender
            const jacksonData = {
                id: 'user_jackson_fitzgerald',
                name: 'Jackson Fitzgerald',
                email: 'jackson@example.com',
                role: 'bartender',
                workplaceName: 'Cork Harbour Pub',
                position: 'Bartender'
            };
            
            // Create staff entry for Jackson
            console.log('👤 Creating staff entry for Jackson Fitzgerald');
            const jacksonStaff = await StaffModel.create(
                corkHarbourPub.id,
                jacksonData,
                'Bartender',
                {
                    notes: 'Experienced bartender, works primarily weekend nights'
                }
            );
            
            if (jacksonStaff) {
                console.log(`✅ Staff entry created with ID: ${jacksonStaff.id}`);
            }
            
            // Mark as initialized
            localStorage.setItem('tipenter_db_initialized', 'true');
            console.log('✅ Database initialization complete');
        } else {
            console.error('❌ Failed to create sample establishment');
        }
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

/**
 * Session initialization function
 * Check if current user has an establishment, create one if needed
 * @param {UserModel} user - The current user
 * @returns {Promise<{user: UserModel, establishment: EstablishmentModel|null, staff: StaffModel|null}>}
 */
export async function initializeUserSession(user) {
    console.log('🔄 Initializing user session...');
    
    try {
        // Try to find establishments where the user is a staff member
        const userStaff = await StaffModel.getByUserId(user.id);
        
        // If user is not associated with any establishment
        if (!userStaff || userStaff.length === 0) {
            console.log('👤 User has no establishments, creating sample data...');
            
            // Create sample establishment
            const corkHarbourPub = await EstablishmentModel.createSampleEstablishment();
            
            if (corkHarbourPub && corkHarbourPub.id) {
                // Create staff entry for user
                const staff = await StaffModel.create(
                    corkHarbourPub.id,
                    user,
                    'Bartender',
                    {
                        notes: 'Auto-created during session initialization'
                    }
                );
                
                // Update user with establishment info
                user.workplaceId = corkHarbourPub.id;
                user.workplaceName = corkHarbourPub.name;
                user.position = 'Bartender';
                await user.updateProfile(user);
                
                return {
                    user,
                    establishment: corkHarbourPub,
                    staff
                };
            }
        } else {
            // User already has establishments
            console.log(`👤 User has ${userStaff.length} establishments`);
            
            // Get the first establishment
            const staff = userStaff[0];
            const establishment = await EstablishmentModel.getById(staff.establishmentId);
            
            // Update user with establishment info if needed
            if (!user.workplaceId || user.workplaceId !== staff.establishmentId) {
                user.workplaceId = staff.establishmentId;
                user.workplaceName = establishment ? establishment.name : 'Unknown Establishment';
                user.position = staff.role;
                await user.updateProfile(user);
            }
            
            return {
                user,
                establishment,
                staff
            };
        }
    } catch (error) {
        console.error('❌ Error initializing user session:', error);
    }
    
    return { user, establishment: null, staff: null };
}
