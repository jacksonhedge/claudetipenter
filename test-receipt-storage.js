/**
 * Test script for populating receipts from Supabase storage
 * This script tests the functionality of loading receipts from the storage bin
 */

// Import Supabase service
import supabaseService from './js/services/supabaseService.js';

// Main function to test receipt storage functionality
async function testReceiptStorage() {
    try {
        console.log('Starting receipt storage test...');
        
        // Initialize Supabase client
        if (!supabaseService.supabase) {
            console.error('Supabase client not initialized');
            return;
        }
        
        console.log('Supabase client initialized successfully');
        
        // Get list of files from the receipt-images storage bucket
        console.log('Fetching files from receipt-images storage bucket...');
        const { data: files, error: listError } = await supabaseService.supabase
            .storage
            .from('receipt-images')
            .list();
        
        if (listError) {
            console.error('Error listing files:', listError);
            return;
        }
        
        console.log(`Found ${files.length} files in storage bin`);
        
        // Filter for image files
        const imageFiles = files.filter(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
        });
        
        console.log(`Found ${imageFiles.length} image files`);
        
        // Process each image file
        const processedReceipts = [];
        
        for (const file of imageFiles) {
            console.log(`Processing file: ${file.name}`);
            
            // Check if this file has already been processed
            const { data: existingReceipts, error: checkError } = await supabaseService.supabase
                .from('receipts')
                .select('id')
                .eq('image_url', `${supabaseService.supabase.storage.from('receipt-images').getPublicUrl(file.name).data.publicUrl}`);
            
            if (checkError) {
                console.error(`Error checking existing receipts for ${file.name}:`, checkError);
                continue;
            }
            
            // Skip if already processed
            if (existingReceipts && existingReceipts.length > 0) {
                console.log(`Skipping already processed file: ${file.name}`);
                continue;
            }
            
            // Get user ID from file path (assuming format: userId/timestamp.ext)
            const userId = file.name.split('/')[0];
            console.log(`User ID: ${userId}`);
            
            // Get user profile
            const { data: userProfile, error: userError } = await supabaseService.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
                console.warn(`Error getting user profile for ${userId}:`, userError);
            }
            
            console.log(`User profile: ${userProfile ? JSON.stringify(userProfile) : 'Not found'}`);
            
            // Get public URL for the image
            const publicUrl = supabaseService.supabase
                .storage
                .from('receipt-images')
                .getPublicUrl(file.name).data.publicUrl;
            
            console.log(`Public URL: ${publicUrl}`);
            
            // Create a new receipt record
            const newReceipt = {
                user_id: userId,
                image_url: publicUrl,
                created_at: new Date().toISOString(),
                // Set default values for other fields
                customer_name: userProfile?.full_name || 'Unknown',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                check_number: '',
                amount: '$0.00',
                tip: '$0.00',
                total: '$0.00',
                payment_type: '',
                signed: 'false',
                approval_status: null
            };
            
            console.log(`New receipt: ${JSON.stringify(newReceipt)}`);
            
            // Insert the new receipt
            const { data: insertedReceipt, error: insertError } = await supabaseService.supabase
                .from('receipts')
                .insert([newReceipt])
                .select();
            
            if (insertError) {
                console.error(`Error inserting receipt for ${file.name}:`, insertError);
                continue;
            }
            
            console.log(`Added new receipt from storage: ${file.name}`);
            
            // Add to processed receipts array
            if (insertedReceipt && insertedReceipt.length > 0) {
                processedReceipts.push({
                    ...insertedReceipt[0],
                    profiles: userProfile
                });
            }
        }
        
        console.log(`Processed ${processedReceipts.length} new receipts from storage`);
        console.log('Receipt storage test completed successfully');
        
        return processedReceipts;
    } catch (error) {
        console.error('Error in receipt storage test:', error);
    }
}

// Run the test
testReceiptStorage().then(receipts => {
    console.log(`Test completed with ${receipts ? receipts.length : 0} new receipts processed`);
}).catch(error => {
    console.error('Test failed:', error);
});
