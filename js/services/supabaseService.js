/**
 * Supabase Service for TipEnter
 * Handles authentication and database operations with Supabase
 */

// Supabase client initialization
// Note: This file expects the Supabase client to be loaded via CDN in the HTML file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Import configuration from config.js
import { SUPABASE_CONFIG } from '../config.js';

// Supabase configuration from config.js (which uses environment variables if available)
const SUPABASE_URL = SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.ANON_KEY;

// Initialize the Supabase client
// Check if Supabase is loaded
let supabaseClient;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized from global supabase object');
} else {
    console.error('Supabase client not loaded. Make sure to include the Supabase CDN in your HTML file.');
    // Create a mock client to prevent errors
    supabaseClient = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
            signOut: () => Promise.resolve({ error: new Error('Supabase not loaded') }),
            resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not loaded') })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
                    order: () => ({
                        range: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') })
                    })
                }),
                not: () => ({
                    order: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') })
                }),
                order: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
                insert: () => Promise.resolve({ error: new Error('Supabase not loaded') }),
                update: () => ({
                    eq: () => Promise.resolve({ error: new Error('Supabase not loaded') })
                })
            })
        }),
        storage: {
            from: () => ({
                list: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
                upload: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }),
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        }
    };
}

/**
 * Supabase Service Class
 * Provides methods for authentication and database operations
 */
class SupabaseService {
  constructor() {
    this.supabase = supabaseClient;
    this.user = null;
    
    // Initialize by checking for existing session
    this.initializeSession();
  }
  
  /**
   * Initialize session from local storage
   */
  async initializeSession() {
    // Get session from local storage
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (session) {
      this.user = session.user;
      console.log('User session restored:', this.user.email);
    }
  }
  
  /**
   * Sign up a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {object} userData - Additional user data
   * @returns {Promise<object>} - Sign up result
   */
  async signUp(email, password, userData = {}) {
    try {
      // Sign up the user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            role: userData.role || 'user',
            establishment: userData.establishment || '',
            // Add any other user metadata fields here
          }
        }
      });
      
      if (error) throw error;
      
      this.user = data.user;
      
      // Create a profile record in the profiles table
      if (this.user) {
        await this.createUserProfile(this.user.id, userData);
      }
      
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Sign up error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Sign in an existing user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<object>} - Sign in result
   */
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      this.user = data.user;
      return { success: true, user: this.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Sign out the current user
   * @returns {Promise<object>} - Sign out result
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) throw error;
      
      this.user = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Reset password
   * @param {string} email - User's email
   * @returns {Promise<object>} - Password reset result
   */
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get the current user
   * @returns {object|null} - Current user or null if not signed in
   */
  getCurrentUser() {
    return this.user;
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated() {
    return !!this.user;
  }
  
  /**
   * Create a user profile in the profiles table
   * @param {string} userId - User ID
   * @param {object} userData - User profile data
   * @returns {Promise<object>} - Create profile result
   */
  async createUserProfile(userId, userData) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: userData.fullName || '',
            role: userData.role || 'user',
            establishment: userData.establishment || '',
            subscription_tier: userData.subscriptionTier || 'free',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Create profile error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user profile
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<object>} - User profile
   */
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.user?.id;
      
      if (!targetUserId) {
        throw new Error('No user ID provided and no current user');
      }
      
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;
      
      return { success: true, profile: data };
    } catch (error) {
      console.error('Get profile error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user profile
   * @param {object} profileData - Profile data to update
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<object>} - Update profile result
   */
  async updateUserProfile(profileData, userId = null) {
    try {
      const targetUserId = userId || this.user?.id;
      
      if (!targetUserId) {
        throw new Error('No user ID provided and no current user');
      }
      
      const { error } = await this.supabase
        .from('profiles')
        .update(profileData)
        .eq('id', targetUserId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Save processed receipt data
   * @param {object} receiptData - Receipt data to save
   * @returns {Promise<object>} - Save receipt result
   */
  async saveReceipt(receiptData) {
    try {
      if (!this.user) {
        throw new Error('User must be authenticated to save receipts');
      }
      
      const { error } = await this.supabase
        .from('receipts')
        .insert([
          {
            user_id: this.user.id,
            customer_name: receiptData.customer_name,
            date: receiptData.date,
            time: receiptData.time,
            check_number: receiptData.check_number,
            amount: receiptData.amount,
            tip: receiptData.tip,
            total: receiptData.total,
            payment_type: receiptData.payment_type,
            signed: receiptData.signed,
            image_url: receiptData.image_url || null,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Save receipt error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user's receipts
   * @param {object} options - Query options (limit, offset, etc.)
   * @returns {Promise<object>} - User receipts
   */
  async getUserReceipts(options = { limit: 50, offset: 0 }) {
    try {
      if (!this.user) {
        throw new Error('User must be authenticated to get receipts');
      }
      
      const { data, error } = await this.supabase
        .from('receipts')
        .select('*')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1);
      
      if (error) throw error;
      
      return { success: true, receipts: data };
    } catch (error) {
      console.error('Get receipts error:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get receipts by date range
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @param {object} options - Additional options (limit, offset, etc.)
   * @returns {Promise<object>} - Receipts within date range
   */
  async getReceiptsByDateRange(startDate, endDate, options = {}) {
    try {
      if (!this.user) {
        throw new Error('User must be authenticated to get receipts');
      }
      
      // Import formatDateForSupabase from date-utils.js
      const { formatDateForSupabase } = await import('../date-utils.js');
      
      // Format dates for Supabase
      const formattedStartDate = formatDateForSupabase(startDate);
      const formattedEndDate = formatDateForSupabase(endDate, true);
      
      console.log(`Fetching receipts from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Build query
      let query = this.supabase
        .from('receipts')
        .select('*')
        .eq('user_id', this.user.id);
      
      // Add date range filter
      if (formattedStartDate && formattedEndDate) {
        query = query
          .gte('created_at', formattedStartDate)
          .lte('created_at', formattedEndDate);
      }
      
      // Add order by
      query = query.order('created_at', { ascending: options.ascending || false });
      
      // Add pagination
      if (options.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { 
        success: true, 
        receipts: data || [],
        count
      };
    } catch (error) {
      console.error('Get receipts by date range error:', error.message);
      return { 
        success: false, 
        error: error.message,
        receipts: []
      };
    }
  }
  
  /**
   * Upload receipt image to Supabase Storage
   * @param {File} file - Image file to upload
   * @returns {Promise<object>} - Upload result with URL
   */
  async uploadReceiptImage(file) {
    try {
      if (!this.user) {
        throw new Error('User must be authenticated to upload images');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await this.supabase
        .storage
        .from('receipt-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = this.supabase
        .storage
        .from('receipt-images')
        .getPublicUrl(data.path);
      
      return { success: true, path: data.path, url: publicUrl };
    } catch (error) {
      console.error('Upload image error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Create and export a singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
