/**
 * Admin Data Service
 * This service provides data from Firebase to the admin components
 */

import { 
    db, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc,
    addDoc,
    deleteDoc
} from '../firebase-config.js';

// Cache for data to avoid unnecessary database calls
const cache = {
    users: null,
    restaurants: null,
    subscriptions: null,
    lastFetched: {
        users: null,
        restaurants: null,
        subscriptions: null
    }
};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Check if cache is valid
 * @param {string} key - Cache key
 * @returns {boolean} - Whether cache is valid
 */
const isCacheValid = (key) => {
    if (!cache[key] || !cache.lastFetched[key]) {
        return false;
    }
    
    const now = new Date().getTime();
    const lastFetched = cache.lastFetched[key];
    
    return (now - lastFetched) < CACHE_EXPIRATION;
};

/**
 * Get all users from Firebase
 * @returns {Promise<Array>} - Array of user objects
 */
export const getUsers = async () => {
    try {
        // Check cache first
        if (isCacheValid('users')) {
            console.log('Using cached users data');
            return cache.users;
        }
        
        console.log('Fetching users from Firebase...');
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort users by creation date (newest first)
        users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update cache
        cache.users = users;
        cache.lastFetched.users = new Date().getTime();
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User object
 */
export const getUserById = async (userId) => {
    try {
        // Check cache first
        if (isCacheValid('users')) {
            const user = cache.users.find(u => u.id === userId);
            if (user) {
                return user;
            }
        }
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        
        throw new Error(`User with ID ${userId} not found`);
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, userData) => {
    try {
        await updateDoc(doc(db, 'users', userId), userData);
        
        // Invalidate cache
        cache.users = null;
        cache.lastFetched.users = null;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
    try {
        await deleteDoc(doc(db, 'users', userId));
        
        // Invalidate cache
        cache.users = null;
        cache.lastFetched.users = null;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

/**
 * Get all restaurants from Firebase
 * @returns {Promise<Array>} - Array of restaurant objects
 */
export const getRestaurants = async () => {
    try {
        // Check cache first
        if (isCacheValid('restaurants')) {
            console.log('Using cached restaurants data');
            return cache.restaurants;
        }
        
        console.log('Fetching restaurants from Firebase...');
        const restaurantsQuery = query(collection(db, 'workplaces'));
        const querySnapshot = await getDocs(restaurantsQuery);
        
        const restaurants = [];
        querySnapshot.forEach((doc) => {
            restaurants.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort restaurants by creation date (newest first)
        restaurants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update cache
        cache.restaurants = restaurants;
        cache.lastFetched.restaurants = new Date().getTime();
        
        return restaurants;
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
    }
};

/**
 * Get restaurant by ID
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Object>} - Restaurant object
 */
export const getRestaurantById = async (restaurantId) => {
    try {
        // Check cache first
        if (isCacheValid('restaurants')) {
            const restaurant = cache.restaurants.find(r => r.id === restaurantId);
            if (restaurant) {
                return restaurant;
            }
        }
        
        const restaurantDoc = await getDoc(doc(db, 'workplaces', restaurantId));
        if (restaurantDoc.exists()) {
            return { id: restaurantDoc.id, ...restaurantDoc.data() };
        }
        
        throw new Error(`Restaurant with ID ${restaurantId} not found`);
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
    }
};

/**
 * Add restaurant
 * @param {Object} restaurantData - Restaurant data
 * @returns {Promise<string>} - New restaurant ID
 */
export const addRestaurant = async (restaurantData) => {
    try {
        // Add created_at timestamp if not provided
        if (!restaurantData.created_at) {
            restaurantData.created_at = new Date().toISOString();
        }
        
        const docRef = await addDoc(collection(db, 'workplaces'), restaurantData);
        
        // Invalidate cache
        cache.restaurants = null;
        cache.lastFetched.restaurants = null;
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding restaurant:', error);
        throw error;
    }
};

/**
 * Update restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} restaurantData - Restaurant data to update
 * @returns {Promise<void>}
 */
export const updateRestaurant = async (restaurantId, restaurantData) => {
    try {
        await updateDoc(doc(db, 'workplaces', restaurantId), restaurantData);
        
        // Invalidate cache
        cache.restaurants = null;
        cache.lastFetched.restaurants = null;
    } catch (error) {
        console.error('Error updating restaurant:', error);
        throw error;
    }
};

/**
 * Delete restaurant
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<void>}
 */
export const deleteRestaurant = async (restaurantId) => {
    try {
        await deleteDoc(doc(db, 'workplaces', restaurantId));
        
        // Invalidate cache
        cache.restaurants = null;
        cache.lastFetched.restaurants = null;
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        throw error;
    }
};

/**
 * Get all subscriptions from Firebase
 * @returns {Promise<Array>} - Array of subscription objects
 */
export const getSubscriptions = async () => {
    try {
        // Check cache first
        if (isCacheValid('subscriptions')) {
            console.log('Using cached subscriptions data');
            return cache.subscriptions;
        }
        
        console.log('Fetching subscriptions from Firebase...');
        const subscriptionsQuery = query(collection(db, 'subscriptions'));
        const querySnapshot = await getDocs(subscriptionsQuery);
        
        const subscriptions = [];
        querySnapshot.forEach((doc) => {
            subscriptions.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort subscriptions by creation date (newest first)
        subscriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update cache
        cache.subscriptions = subscriptions;
        cache.lastFetched.subscriptions = new Date().getTime();
        
        return subscriptions;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
};

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} - Subscription object
 */
export const getSubscriptionById = async (subscriptionId) => {
    try {
        // Check cache first
        if (isCacheValid('subscriptions')) {
            const subscription = cache.subscriptions.find(s => s.id === subscriptionId);
            if (subscription) {
                return subscription;
            }
        }
        
        const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (subscriptionDoc.exists()) {
            return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
        }
        
        throw new Error(`Subscription with ID ${subscriptionId} not found`);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        throw error;
    }
};

/**
 * Update subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} subscriptionData - Subscription data to update
 * @returns {Promise<void>}
 */
export const updateSubscription = async (subscriptionId, subscriptionData) => {
    try {
        await updateDoc(doc(db, 'subscriptions', subscriptionId), subscriptionData);
        
        // Invalidate cache
        cache.subscriptions = null;
        cache.lastFetched.subscriptions = null;
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
};

/**
 * Delete subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<void>}
 */
export const deleteSubscription = async (subscriptionId) => {
    try {
        await deleteDoc(doc(db, 'subscriptions', subscriptionId));
        
        // Invalidate cache
        cache.subscriptions = null;
        cache.lastFetched.subscriptions = null;
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw error;
    }
};

/**
 * Get subscription stats
 * @returns {Promise<Object>} - Subscription stats
 */
export const getSubscriptionStats = async () => {
    try {
        const users = await getUsers();
        const subscriptions = await getSubscriptions();
        
        // Calculate user stats
        const freeUsers = users.filter(user => !user.subscription_tier || user.subscription_tier === 'FREE' || user.subscription_tier === 'free').length;
        const premiumUsers = users.filter(user => user.subscription_tier === 'PREMIUM' || user.subscription_tier === 'premium').length;
        const teamUsers = users.filter(user => user.subscription_tier === 'TEAM' || user.subscription_tier === 'team').length;
        
        // Calculate financial stats
        const totalRevenue = subscriptions.reduce((total, sub) => total + (parseFloat(sub.amount) || 0), 0);
        const averageRevenuePerUser = users.length > 0 ? (totalRevenue / users.length).toFixed(2) : '0.00';
        
        // Calculate usage stats
        const totalScansThisMonth = 1482; // This would come from a real calculation in a production app
        const averageScansPerUser = users.length > 0 ? (totalScansThisMonth / users.length).toFixed(1) : '0.0';
        
        return {
            user_stats: {
                total_users: users.length,
                free_users: freeUsers,
                premium_users: premiumUsers,
                team_users: teamUsers
            },
            financial_stats: {
                mrr: totalRevenue.toFixed(2),
                average_revenue_per_user: averageRevenuePerUser
            },
            usage_stats: {
                total_scans_this_month: totalScansThisMonth,
                average_scans_per_user: averageScansPerUser
            },
            api_stats: {
                total_api_cost: "125.37",
                average_cost_per_scan: "0.085",
                total_processing_time: "1842.5" // in minutes
            }
        };
    } catch (error) {
        console.error('Error calculating subscription stats:', error);
        throw error;
    }
};

/**
 * Get monthly stats
 * @returns {Promise<Array>} - Array of monthly stats
 */
export const getMonthlyStats = async () => {
    // In a real application, this would fetch data from Firebase
    // For now, we'll generate mock data
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const mockMonthlyData = months.map((month, index) => {
        const baseUsers = 70 + index * 10;
        const baseMRR = 300 + index * 50;
        const baseScans = 800 + index * 120;
        
        // Add some random variation
        const randomFactor = 0.9 + Math.random() * 0.2;
        
        return {
            month,
            users: Math.round(baseUsers * randomFactor),
            free_users: Math.round((baseUsers * 0.7) * randomFactor),
            paying_users: Math.round((baseUsers * 0.3) * randomFactor),
            mrr: Math.round(baseMRR * randomFactor),
            scans: Math.round(baseScans * randomFactor)
        };
    });
    
    return mockMonthlyData;
};

// Export a default object with all functions
export default {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getRestaurants,
    getRestaurantById,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
    getSubscriptionStats,
    getMonthlyStats
};
