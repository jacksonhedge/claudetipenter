/**
 * Firebase Initialization
 * Handles initialization of Firebase and Firestore collections
 */
import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Initialize Firestore collections
 * This creates required collections if they don't exist to ensure schema exists
 */
export async function initializeFirestore() {
    console.log('🔥 Initializing Firestore collections...');
    
    try {
        // Check if collections exist, create them if not
        await ensureCollectionExists('users');
        await ensureCollectionExists('workplaces');
        await ensureCollectionExists('user_workplaces');
        await ensureCollectionExists('uploaded_images');
        
        console.log('✅ Firestore collections initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error);
        return false;
    }
}

/**
 * Ensure a collection exists by creating a temporary document if needed
 * @param {string} collectionName - The collection name to ensure exists
 */
async function ensureCollectionExists(collectionName) {
    try {
        // Try to get documents from the collection
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        // If collection exists and has documents, we're good
        if (!querySnapshot.empty) {
            console.log(`✓ Collection '${collectionName}' exists with ${querySnapshot.size} documents`);
            return;
        }
        
        // Collection might exist but be empty, or not exist at all
        // Create a temporary document to ensure collection exists
        const tempDocRef = doc(collection(db, collectionName), '_temp_init_doc');
        
        // Create a temporary document with minimal data
        await setDoc(tempDocRef, {
            _created_by: 'system',
            _purpose: 'initialization',
            _created_at: serverTimestamp()
        });
        
        console.log(`🔧 Created temporary document in '${collectionName}' collection`);
        
        // For production, you might want to delete this document after confirmation
        // But for now, we'll leave it as evidence the initialization ran
    } catch (error) {
        console.error(`❌ Error ensuring collection '${collectionName}' exists:`, error);
        // We'll continue despite errors, as the permissions might be an issue
        // but we want the app to continue functioning
    }
}

/**
 * Initialize Firebase and ensure all required collections exist
 * Call this at app startup
 */
export function initializeFirebase() {
    console.log('🔄 Starting Firebase initialization...');
    
    // Return a promise that resolves when initialization is complete
    return new Promise((resolve) => {
        // Initialize Firestore collections
        initializeFirestore()
            .then((success) => {
                if (success) {
                    console.log('✅ Firebase initialization complete');
                } else {
                    console.warn('⚠️ Firebase initialization completed with warnings');
                }
                resolve(success);
            })
            .catch((error) => {
                console.error('❌ Firebase initialization failed:', error);
                // Resolve anyway to allow app to continue
                resolve(false);
            });
    });
}
