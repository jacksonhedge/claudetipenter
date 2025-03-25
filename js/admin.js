// Import Firebase modules
import { 
    auth, 
    db, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc,
    onAuthStateChanged
} from './firebase-config.js';

// DOM Elements
const userTableBody = document.getElementById('users-table-body');
const restaurantTableBody = document.getElementById('restaurants-table-body');
const subscriptionTableBody = document.getElementById('subscription-table-body');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const userCount = document.getElementById('user-count');
const restaurantCount = document.getElementById('restaurant-count');
const subscriptionCount = document.getElementById('subscription-count');
const revenueTotal = document.getElementById('revenue-total');
const logoutBtn = document.getElementById('sign-out-btn');
const navItems = document.querySelectorAll('.admin-nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// State
let currentUser = null;
let users = [];
let restaurants = [];
let subscriptions = [];

// Check if admin login is enabled
const isAdminLoginEnabled = document.getElementById('admin-login-overlay') !== null;

// Mock data for admin login mode
const mockUsers = [
    {
        id: 'user1',
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'manager',
        workplaceId: 'rest1',
        workplaceName: 'The Fancy Restaurant',
        created_at: new Date(2024, 0, 15).toISOString(),
        last_login: new Date(2024, 2, 20).toISOString()
    },
    {
        id: 'user2',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        role: 'bartender',
        workplaceId: 'rest1',
        workplaceName: 'The Fancy Restaurant',
        created_at: new Date(2024, 1, 10).toISOString(),
        last_login: new Date(2024, 2, 22).toISOString()
    },
    {
        id: 'user3',
        email: 'bob.johnson@example.com',
        name: 'Bob Johnson',
        role: 'manager',
        workplaceId: 'rest2',
        workplaceName: 'Downtown Bar & Grill',
        created_at: new Date(2024, 2, 5).toISOString(),
        last_login: new Date(2024, 2, 23).toISOString()
    }
];

const mockRestaurants = [
    {
        id: 'rest1',
        name: 'The Fancy Restaurant',
        type: 'restaurant',
        address: '123 Main St, New York, NY',
        phone: '(212) 555-1234',
        email: 'info@fancyrestaurant.com',
        created_at: new Date(2023, 11, 10).toISOString()
    },
    {
        id: 'rest2',
        name: 'Downtown Bar & Grill',
        type: 'bar',
        address: '456 Broadway, New York, NY',
        phone: '(212) 555-5678',
        email: 'info@downtownbar.com',
        created_at: new Date(2024, 0, 5).toISOString()
    },
    {
        id: 'rest3',
        name: 'Cozy Cafe',
        type: 'cafe',
        address: '789 Park Ave, New York, NY',
        phone: '(212) 555-9012',
        email: 'info@cozycafe.com',
        created_at: new Date(2024, 1, 15).toISOString()
    }
];

const mockSubscriptions = [
    {
        id: 'sub1',
        user_id: 'user1',
        plan_name: 'Premium',
        amount: 99.99,
        created_at: new Date(2024, 0, 15).toISOString(),
        expiry_date: new Date(2025, 0, 15).toISOString()
    },
    {
        id: 'sub2',
        user_id: 'user3',
        plan_name: 'Basic',
        amount: 49.99,
        created_at: new Date(2024, 2, 5).toISOString(),
        expiry_date: new Date(2025, 2, 5).toISOString()
    }
];

// If admin login is enabled, load mock data
if (isAdminLoginEnabled) {
    document.addEventListener('DOMContentLoaded', () => {
        // Set up tab navigation
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all nav items
                navItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // Add active class to clicked nav item
                item.classList.add('active');
                
                // Get the tab to show
                const tabId = item.getAttribute('data-tab');
                
                // Hide all tabs
                tabContents.forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show the selected tab
                document.getElementById(tabId).classList.add('active');
            });
        });
        // Check if user is already logged in
        if (localStorage.getItem('admin_logged_in') === 'true') {
            // Load mock data
            users = mockUsers;
            restaurants = mockRestaurants;
            subscriptions = mockSubscriptions;
            
            // Update tables
            updateUserTable();
            updateRestaurantTable();
            updateSubscriptionTable();
            
            // Update dashboard
            updateDashboard();
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    });
} else {
    // Only proceed with Firebase auth if admin login is not enabled
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (userDoc.exists()) {
                    currentUser = { id: user.uid, ...userDoc.data() };
                    
                    // Check if user is a manager
                    if (currentUser.role !== 'manager') {
                        // Redirect to home page if not a manager
                        window.location.href = 'home.html';
                        return;
                    }
                    
                    // Load data
                    await loadUserData();
                    await loadRestaurantData();
                    await loadSubscriptionData();
                    
                    // Update dashboard
                    updateDashboard();
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                    
                    // Set up tab navigation
                    navItems.forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            
                            // Remove active class from all nav items
                            navItems.forEach(navItem => {
                                navItem.classList.remove('active');
                            });
                            
                            // Add active class to clicked nav item
                            item.classList.add('active');
                            
                            // Get the tab to show
                            const tabId = item.getAttribute('data-tab');
                            
                            // Hide all tabs
                            tabContents.forEach(tab => {
                                tab.classList.remove('active');
                            });
                            
                            // Show the selected tab
                            document.getElementById(tabId).classList.add('active');
                        });
                    });
                } else {
                    // Redirect to login page if user data doesn't exist
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Error getting user data:', error);
                showError('Failed to load user data. Please try again later.');
            }
        } else {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
        }
    });
}

// Load user data from Firestore
async function loadUserData() {
    try {
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        
        users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort users by creation date (newest first)
        users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update user table
        updateUserTable();
        
        // Update user count
        if (userCount) {
            userCount.textContent = users.length;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load user data. Please try again later.');
    }
}

// Load restaurant data from Firestore
async function loadRestaurantData() {
    try {
        const restaurantsQuery = query(collection(db, 'workplaces'));
        const querySnapshot = await getDocs(restaurantsQuery);
        
        restaurants = [];
        querySnapshot.forEach((doc) => {
            restaurants.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort restaurants by creation date (newest first)
        restaurants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update restaurant table
        updateRestaurantTable();
        
        // Update restaurant count
        if (restaurantCount) {
            restaurantCount.textContent = restaurants.length;
        }
    } catch (error) {
        console.error('Error loading restaurant data:', error);
        showError('Failed to load restaurant data. Please try again later.');
    }
}

// Load subscription data from Firestore
async function loadSubscriptionData() {
    try {
        const subscriptionsQuery = query(collection(db, 'subscriptions'));
        const querySnapshot = await getDocs(subscriptionsQuery);
        
        subscriptions = [];
        querySnapshot.forEach((doc) => {
            subscriptions.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort subscriptions by creation date (newest first)
        subscriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Update subscription table
        updateSubscriptionTable();
        
        // Update subscription count and revenue
        if (subscriptionCount) {
            subscriptionCount.textContent = subscriptions.length;
        }
        
        // Calculate total revenue
        const totalRevenue = subscriptions.reduce((total, sub) => {
            return total + (sub.amount || 0);
        }, 0);
        
        if (revenueTotal) {
            revenueTotal.textContent = `$${totalRevenue.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading subscription data:', error);
        showError('Failed to load subscription data. Please try again later.');
    }
}

// Update user table
function updateUserTable() {
    if (!userTableBody) return;
    
    userTableBody.innerHTML = '';
    
    users.forEach((user) => {
        const row = document.createElement('tr');
        
        // Format date
        const createdDate = new Date(user.created_at);
        const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
        
        // Format last login date
        let lastLoginText = 'Never';
        if (user.last_login) {
            const lastLoginDate = new Date(user.last_login);
            lastLoginText = `${lastLoginDate.toLocaleDateString()} ${lastLoginDate.toLocaleTimeString()}`;
        }
        
        row.innerHTML = `
            <td>${user.email || 'N/A'}</td>
            <td>${user.workplaceName || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>${lastLoginText}</td>
            <td>${user.id}</td>
            <td>
                <button class="action-btn edit-user" data-id="${user.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-user" data-id="${user.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        userTableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            deleteUser(userId);
        });
    });
}

// Update restaurant table
function updateRestaurantTable() {
    if (!restaurantTableBody) return;
    
    restaurantTableBody.innerHTML = '';
    
    restaurants.forEach((restaurant) => {
        const row = document.createElement('tr');
        
        // Format date
        const createdDate = new Date(restaurant.created_at);
        const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
        
        // Count users for this restaurant
        const userCount = users.filter(user => user.workplaceId === restaurant.id).length;
        
        row.innerHTML = `
            <td>${restaurant.name || 'N/A'}</td>
            <td>${restaurant.type || 'N/A'}</td>
            <td>${restaurant.address || 'N/A'}</td>
            <td>${restaurant.phone || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="action-btn edit-restaurant" data-id="${restaurant.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-restaurant" data-id="${restaurant.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        restaurantTableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-restaurant').forEach(btn => {
        btn.addEventListener('click', () => {
            const restaurantId = btn.getAttribute('data-id');
            editRestaurant(restaurantId);
        });
    });
    
    document.querySelectorAll('.delete-restaurant').forEach(btn => {
        btn.addEventListener('click', () => {
            const restaurantId = btn.getAttribute('data-id');
            deleteRestaurant(restaurantId);
        });
    });
}

// Update subscription table
function updateSubscriptionTable() {
    if (!subscriptionTableBody) return;
    
    subscriptionTableBody.innerHTML = '';
    
    subscriptions.forEach((subscription) => {
        const row = document.createElement('tr');
        
        // Find user
        const user = users.find(u => u.id === subscription.user_id);
        
        // Format dates
        const createdDate = new Date(subscription.created_at);
        const formattedCreatedDate = `${createdDate.toLocaleDateString()}`;
        
        const expiryDate = new Date(subscription.expiry_date);
        const formattedExpiryDate = `${expiryDate.toLocaleDateString()}`;
        
        // Determine status
        let status = 'Active';
        if (new Date() > expiryDate) {
            status = 'Expired';
        }
        
        row.innerHTML = `
            <td>${user ? user.name : 'Unknown'}</td>
            <td>${user ? user.email : 'Unknown'}</td>
            <td>${subscription.plan_name || 'N/A'}</td>
            <td>$${subscription.amount ? subscription.amount.toFixed(2) : '0.00'}</td>
            <td>${formattedCreatedDate}</td>
            <td>${formattedExpiryDate}</td>
            <td>${status}</td>
            <td>
                <button class="action-btn edit-subscription" data-id="${subscription.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-subscription" data-id="${subscription.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        subscriptionTableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-subscription').forEach(btn => {
        btn.addEventListener('click', () => {
            const subscriptionId = btn.getAttribute('data-id');
            editSubscription(subscriptionId);
        });
    });
    
    document.querySelectorAll('.delete-subscription').forEach(btn => {
        btn.addEventListener('click', () => {
            const subscriptionId = btn.getAttribute('data-id');
            deleteSubscription(subscriptionId);
        });
    });
}

// Update dashboard
function updateDashboard() {
    // Update user count
    if (userCount) {
        userCount.textContent = users.length;
    }
    
    // Update restaurant count
    if (restaurantCount) {
        restaurantCount.textContent = restaurants.length;
    }
    
    // Update subscription count
    if (subscriptionCount) {
        subscriptionCount.textContent = subscriptions.length;
    }
    
    // Calculate total revenue
    const totalRevenue = subscriptions.reduce((total, sub) => {
        return total + (sub.amount || 0);
    }, 0);
    
    if (revenueTotal) {
        revenueTotal.textContent = `$${totalRevenue.toFixed(2)}`;
    }
}

// Edit user
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showError('User not found');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit User</h2>
            <form id="edit-user-form">
                <div class="form-group">
                    <label for="edit-name">Name</label>
                    <input type="text" id="edit-name" name="name" value="${user.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" name="email" value="${user.email || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-role">Role</label>
                    <select id="edit-role" name="role" required>
                        <option value="bartender" ${user.role === 'bartender' ? 'selected' : ''}>Bartender</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-workplace">Workplace</label>
                    <select id="edit-workplace" name="workplace" required>
                        ${restaurants.map(r => `<option value="${r.id}" ${user.workplaceId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-subscription">Subscription Tier</label>
                    <select id="edit-subscription" name="subscription_tier" required>
                        <option value="free" ${user.subscription_tier === 'free' ? 'selected' : ''}>Free</option>
                        <option value="basic" ${user.subscription_tier === 'basic' ? 'selected' : ''}>Basic</option>
                        <option value="premium" ${user.subscription_tier === 'premium' ? 'selected' : ''}>Premium</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle form submission
    modal.querySelector('#edit-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedUser = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            workplaceId: formData.get('workplace'),
            workplaceName: restaurants.find(r => r.id === formData.get('workplace'))?.name || '',
            subscription_tier: formData.get('subscription_tier')
        };
        
        try {
            // Update user in Firestore
            await updateDoc(doc(db, 'users', userId), updatedUser);
            
            // Reload user data
            await loadUserData();
            
            // Close modal
            document.body.removeChild(modal);
            
            // Show success message
            alert('User updated successfully');
        } catch (error) {
            console.error('Error updating user:', error);
            showError('Failed to update user. Please try again later.');
        }
    });
}

// Delete user
function deleteUser(userId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    // In a real application, you would delete the user from Firestore
    // For this demo, we'll just remove the user from the local array
    users = users.filter(u => u.id !== userId);
    
    // Update user table
    updateUserTable();
    
    // Update dashboard
    updateDashboard();
    
    // Show success message
    alert('User deleted successfully');
}

// Edit restaurant
function editRestaurant(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    
    if (!restaurant) {
        showError('Restaurant not found');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Restaurant</h2>
            <form id="edit-restaurant-form">
                <div class="form-group">
                    <label for="edit-name">Name</label>
                    <input type="text" id="edit-name" name="name" value="${restaurant.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-address">Address</label>
                    <input type="text" id="edit-address" name="address" value="${restaurant.address || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-phone">Phone</label>
                    <input type="text" id="edit-phone" name="phone" value="${restaurant.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" name="email" value="${restaurant.email || ''}">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle form submission
    modal.querySelector('#edit-restaurant-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedRestaurant = {
            name: formData.get('name'),
            address: formData.get('address'),
            phone: formData.get('phone'),
            email: formData.get('email')
        };
        
        try {
            // Update restaurant in Firestore
            await updateDoc(doc(db, 'workplaces', restaurantId), updatedRestaurant);
            
            // Reload restaurant data
            await loadRestaurantData();
            
            // Close modal
            document.body.removeChild(modal);
            
            // Show success message
            alert('Restaurant updated successfully');
        } catch (error) {
            console.error('Error updating restaurant:', error);
            showError('Failed to update restaurant. Please try again later.');
        }
    });
}

// Delete restaurant
function deleteRestaurant(restaurantId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this restaurant?')) {
        return;
    }
    
    // In a real application, you would delete the restaurant from Firestore
    // For this demo, we'll just remove the restaurant from the local array
    restaurants = restaurants.filter(r => r.id !== restaurantId);
    
    // Update restaurant table
    updateRestaurantTable();
    
    // Update dashboard
    updateDashboard();
    
    // Show success message
    alert('Restaurant deleted successfully');
}

// Edit subscription
function editSubscription(subscriptionId) {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    
    if (!subscription) {
        showError('Subscription not found');
        return;
    }
    
    // Find user
    const user = users.find(u => u.id === subscription.user_id);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Subscription</h2>
            <form id="edit-subscription-form">
                <div class="form-group">
                    <label for="edit-user">User</label>
                    <input type="text" id="edit-user" value="${user ? user.name : 'Unknown'}" disabled>
                </div>
                <div class="form-group">
                    <label for="edit-plan">Plan</label>
                    <select id="edit-plan" name="plan_name" required>
                        <option value="Basic" ${subscription.plan_name === 'Basic' ? 'selected' : ''}>Basic</option>
                        <option value="Premium" ${subscription.plan_name === 'Premium' ? 'selected' : ''}>Premium</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-amount">Amount</label>
                    <input type="number" id="edit-amount" name="amount" value="${subscription.amount || 0}" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="edit-expiry">Expiry Date</label>
                    <input type="date" id="edit-expiry" name="expiry_date" value="${subscription.expiry_date ? subscription.expiry_date.split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle form submission
    modal.querySelector('#edit-subscription-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedSubscription = {
            plan_name: formData.get('plan_name'),
            amount: parseFloat(formData.get('amount')),
            expiry_date: formData.get('expiry_date')
        };
        
        try {
            // Update subscription in Firestore
            await updateDoc(doc(db, 'subscriptions', subscriptionId), updatedSubscription);
            
            // Reload subscription data
            await loadSubscriptionData();
            
            // Close modal
            document.body.removeChild(modal);
            
            // Show success message
            alert('Subscription updated successfully');
        } catch (error) {
            console.error('Error updating subscription:', error);
            showError('Failed to update subscription. Please try again later.');
        }
    });
}

// Delete subscription
function deleteSubscription(subscriptionId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this subscription?')) {
        return;
    }
    
    // In a real application, you would delete the subscription from Firestore
    // For this demo, we'll just remove the subscription from the local array
    subscriptions = subscriptions.filter(s => s.id !== subscriptionId);
    
    // Update subscription table
    updateSubscriptionTable();
    
    // Update dashboard
    updateDashboard();
    
    // Show success message
    alert('Subscription deleted successfully');
}

// Show error message
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error message after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    } else {
        // Fallback to alert if errorMessage element doesn't exist
        console.error(message);
    }
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            // If using Firebase auth
            if (auth && typeof auth.signOut === 'function') {
                await auth.signOut();
            }
            
            // Clear admin login state
            localStorage.removeItem('admin_logged_in');
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
            showError('Failed to sign out. Please try again later.');
        }
    });
}
