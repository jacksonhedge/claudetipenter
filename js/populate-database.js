/**
 * Database Population Script
 * 
 * This script populates the Firebase database with sample data for testing.
 * It creates establishment records, user records, and associates users with establishments.
 */

import { initializeFirebase } from './firebase-init.js';
import { EstablishmentModel, UserModel, StaffModel } from './models/index.js';

/**
 * Main function to populate the database
 */
async function populateDatabase() {
    console.log('Starting database population script...');
    
    try {
        // Initialize Firebase
        console.log('Initializing Firebase...');
        await initializeFirebase();
        
        // Create Cork Harbour Pub establishment
        console.log('Creating Cork Harbour Pub establishment...');
        const corkHarbourPub = new EstablishmentModel({
            name: "Cork Harbour Pub",
            type: "pub",
            location: {
                address: "123 Butler St",
                city: "Pittsburgh",
                state: "PA",
                zipCode: "15201",
                coordinates: {
                    latitude: 40.4639,
                    longitude: -79.9773
                }
            },
            contact: {
                phone: "412-555-1234",
                email: "info@corkharbourpub.com",
                website: "www.corkharbourpub.com"
            },
            posSystem: "Lightspeed",
            posSystemDetails: {
                version: "5.2",
                apiKey: "********",
                lastSync: new Date().toISOString()
            },
            owner: {
                name: "Alex Smith",
                email: "alex@corkharbourpub.com",
                phone: "412-555-8765"
            },
            manager: {
                name: "Tanner",
                email: "tanner@corkharbourpub.com",
                phone: "412-555-4321",
                role: "General Manager"
            }
        });
        
        // Save establishment to database
        const savedEstablishment = await corkHarbourPub.saveToFirebase();
        if (savedEstablishment) {
            console.log(`✅ Cork Harbour Pub created with ID: ${corkHarbourPub.id}`);
        } else {
            throw new Error('Failed to create Cork Harbour Pub establishment');
        }
        
        // Create Jackson user
        console.log('Creating demo user account for Jackson...');
        const jacksonUser = new UserModel({
            id: 'user_jackson_fitzgerald',
            name: 'Jackson Fitzgerald',
            email: 'jackson@example.com',
            role: 'bartender',
            workplaceId: corkHarbourPub.id,
            workplaceName: 'Cork Harbour Pub',
            position: 'Bartender',
            subscription_tier: 'premium',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_active: true
        });
        
        // Save user to database
        const savedUser = await jacksonUser.saveToFirebase();
        if (savedUser) {
            console.log(`✅ Jackson user created with ID: ${jacksonUser.id}`);
        } else {
            throw new Error('Failed to create Jackson user');
        }
        
        // Create staff record
        console.log('Creating staff record for Jackson...');
        const jacksonStaff = await StaffModel.create(
            corkHarbourPub.id,
            jacksonUser,
            'Bartender',
            {
                notes: 'Experienced bartender, works primarily weekend nights',
                bartenderInfo: {
                    shifts: ['evening', 'weekend'],
                    tipRate: 1.0,
                    specialties: ['cocktails', 'beer'],
                    certified: true
                }
            }
        );
        
        if (jacksonStaff) {
            console.log(`✅ Staff record created with ID: ${jacksonStaff.id}`);
        } else {
            throw new Error('Failed to create staff record');
        }
        
        // Mark as initialized in localStorage
        localStorage.setItem('tipenter_db_initialized', 'true');
        
        console.log('Database populated successfully!');
        console.log('You can now log in with:');
        console.log('Email: jackson@example.com');
        console.log('Password: password123 (this is just a placeholder - use the mock login)');
    } catch (error) {
        console.error('Error populating database:', error);
    }
}

// When the button is clicked, run the script
document.getElementById('populateDbBtn')?.addEventListener('click', async () => {
    console.log('Populating database...');
    document.getElementById('populateDbBtn').disabled = true;
    document.getElementById('populateDbBtn').textContent = 'Populating...';
    
    try {
        await populateDatabase();
        document.getElementById('status').textContent = 'Database populated successfully!';
        document.getElementById('populateDbBtn').textContent = 'Done!';
        document.getElementById('populateDbBtn').disabled = true;
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <h3>Database population complete!</h3>
            <p>You can now log in with:</p>
            <ul>
                <li><strong>Email:</strong> jackson@example.com</li>
                <li><strong>Password:</strong> password123 (this is just a placeholder - use the mock login)</li>
            </ul>
            <p><a href="login.html" class="btn login-link">Go to Login Page</a></p>
        `;
        document.getElementById('results').appendChild(successMessage);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').textContent = 'Error: ' + error.message;
        document.getElementById('populateDbBtn').textContent = 'Try Again';
        document.getElementById('populateDbBtn').disabled = false;
    }
});

// If this is imported in a script tag, export the populateDatabase function
export default populateDatabase;
