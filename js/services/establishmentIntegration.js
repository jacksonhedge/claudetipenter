/**
 * Establishment Integration Service
 * 
 * This service helps integrate existing establishments from Firestore
 * into the Bar Management system.
 */

import { db, collection, getDocs, doc, getDoc } from '../firebase-config.js';
import { BarModel } from '../models/BarModel.js';
import { showNotification } from '../utils/uiUtils.js';

/**
 * Fetch all establishments from Firestore and convert them to Bar models
 * @returns {Promise<Array<BarModel>>} Array of Bar models created from establishments
 */
export async function fetchEstablishmentsAsBars() {
    try {
        console.log('🔍 Fetching establishments from Firestore...');
        const establishmentsCollection = collection(db, 'establishments');
        const snapshot = await getDocs(establishmentsCollection);
        
        if (snapshot.empty) {
            console.log('No establishments found in Firestore');
            return [];
        }
        
        const bars = [];
        
        // Process each establishment
        for (const doc of snapshot.docs) {
            const establishment = { id: doc.id, ...doc.data() };
            console.log('Found establishment:', establishment.name);
            
            // Convert establishment to bar model
            const bar = convertEstablishmentToBar(establishment);
            bars.push(bar);
        }
        
        console.log(`✅ Converted ${bars.length} establishments to bars`);
        return bars;
    } catch (error) {
        console.error('❌ Error fetching establishments:', error);
        return [];
    }
}

/**
 * Convert an establishment document to a BarModel
 * @param {Object} establishment The establishment document from Firestore
 * @returns {BarModel} A new BarModel instance
 */
function convertEstablishmentToBar(establishment) {
    // Map establishment fields to bar fields
    const barData = {
        id: establishment.id,
        name: establishment.name || '',
        type: 'pub', // Default type
        location: {
            address: establishment.address || '',
            city: establishment.city || '',
            state: establishment.state || '',
            zipCode: establishment.zipCode || ''
        },
        posSystem: establishment.possystem || '', // Note the field name difference
        manager: {
            name: establishment.manager || '',
            email: '',
            phone: ''
        },
        barDetails: {
            hasKitchen: true,
            liveMusic: false,
            specialties: ["Craft Beer", "Irish Whiskey"],
            amenities: ["Darts", "TV"]
        }
    };
    
    return new BarModel(barData);
}

/**
 * Import establishments from Firestore into the Bar collection
 * This creates bar documents based on existing establishments
 * @returns {Promise<number>} Number of establishments imported
 */
export async function importEstablishmentsAsBars() {
    try {
        // Get establishments as bar models
        const bars = await fetchEstablishmentsAsBars();
        
        if (bars.length === 0) {
            console.log('No establishments to import');
            return 0;
        }
        
        // Save each bar to Firestore
        let importCount = 0;
        for (const bar of bars) {
            console.log(`Importing establishment "${bar.name}" as bar...`);
            
            // Check if this bar already exists (based on name)
            const existingBars = await getBarsWithName(bar.name);
            
            if (existingBars.length > 0) {
                console.log(`Bar "${bar.name}" already exists, skipping import`);
                continue;
            }
            
            // Save the bar to Firestore
            const success = await bar.saveToFirebase();
            
            if (success) {
                console.log(`✅ Imported establishment "${bar.name}" as bar successfully`);
                importCount++;
            } else {
                console.error(`❌ Failed to import establishment "${bar.name}" as bar`);
            }
        }
        
        if (importCount > 0) {
            showNotification(`Imported ${importCount} establishments as bars`, 'success');
        }
        
        return importCount;
    } catch (error) {
        console.error('❌ Error importing establishments:', error);
        showNotification('Failed to import establishments', 'error');
        return 0;
    }
}

/**
 * Get bars with a specific name
 * @param {string} name Bar name to search for
 * @returns {Promise<Array<Object>>} Array of bar documents
 */
async function getBarsWithName(name) {
    try {
        const barsCollection = collection(db, 'bars');
        const snapshot = await getDocs(barsCollection);
        
        return snapshot.docs
            .filter(doc => doc.data().name === name)
            .map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting bars by name:', error);
        return [];
    }
}

/**
 * Get an establishment by ID
 * @param {string} id Establishment ID
 * @returns {Promise<Object|null>} Establishment object or null if not found
 */
export async function getEstablishmentById(id) {
    try {
        const docRef = doc(db, 'establishments', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        
        return null;
    } catch (error) {
        console.error(`Error getting establishment ${id}:`, error);
        return null;
    }
}

/**
 * Get the "Cork Harbour" establishment
 * This is a convenience function to get the specific establishment mentioned
 * @returns {Promise<Object|null>} The Cork Harbour establishment or null
 */
export async function getCorkHarbourEstablishment() {
    try {
        const establishmentsCollection = collection(db, 'establishments');
        const snapshot = await getDocs(establishmentsCollection);
        
        // Look for Cork Harbour by name
        const corkHarbour = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.name && 
                   data.name.toLowerCase().includes('cork') && 
                   data.name.toLowerCase().includes('harbour');
        });
        
        if (corkHarbour) {
            return { id: corkHarbour.id, ...corkHarbour.data() };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting Cork Harbour establishment:', error);
        return null;
    }
}
