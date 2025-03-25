/**
 * Admin Components Initialization
 * This file initializes admin functionality for the admin page
 * and connects to the Firebase database
 */

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
    onAuthStateChanged,
    addDoc,
    deleteDoc
} from './firebase-config.js';

// Import 7shifts Playground component
import { init7shiftsPlayground } from './components/7shiftsPlayground.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing admin functionality...');
    
    // Initialize 7shifts API playground
    init7shiftsPlayground();
    
    // DOM Elements
    const userTableBody = document.getElementById('users-table-body');
    const restaurantTableBody = document.getElementById('restaurants-table-body');
    const subscriptionDashboardContainer = document.getElementById('subscription-dashboard-container');
    
    // State
    let users = [];
    let restaurants = [];
    let subscriptions = [];
    
    try {
        // Fetch data from Firebase
        console.log('Fetching data from Firebase...');
        
        // Fetch users
        try {
            const usersQuery = query(collection(db, 'users'));
            const querySnapshot = await getDocs(usersQuery);
            
            users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort users by creation date (newest first)
            users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            console.log(`Fetched ${users.length} users`);
            
            // Update user table
            updateUserTable(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Use mock data as fallback
            users = [
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
            updateUserTable(users);
        }
        
        // Fetch restaurants
        try {
            const restaurantsQuery = query(collection(db, 'workplaces'));
            const querySnapshot = await getDocs(restaurantsQuery);
            
            restaurants = [];
            querySnapshot.forEach((doc) => {
                restaurants.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort restaurants by creation date (newest first)
            restaurants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            console.log(`Fetched ${restaurants.length} restaurants`);
            
            // Update restaurant table
            updateRestaurantTable(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            // Use mock data as fallback
            restaurants = [
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
            updateRestaurantTable(restaurants);
        }
        
        // Fetch subscriptions
        try {
            const subscriptionsQuery = query(collection(db, 'subscriptions'));
            const querySnapshot = await getDocs(subscriptionsQuery);
            
            subscriptions = [];
            querySnapshot.forEach((doc) => {
                subscriptions.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort subscriptions by creation date (newest first)
            subscriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            console.log(`Fetched ${subscriptions.length} subscriptions`);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            // Use mock data as fallback
            subscriptions = [
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
        }
        
        // Update dashboard stats
        updateDashboardStats(users, restaurants, subscriptions);
        
    } catch (error) {
        console.error('Error initializing admin functionality:', error);
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Function to update user table
    function updateUserTable(users) {
        if (!userTableBody) return;
        
        userTableBody.innerHTML = '';
        
        if (users.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" class="text-center py-4 text-gray-500">No users found</td>
            `;
            userTableBody.appendChild(row);
            return;
        }
        
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
                editUser(userId, users, restaurants);
            });
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-id');
                deleteUser(userId, users);
            });
        });
    }
    
    // Function to update restaurant table
    function updateRestaurantTable(restaurants) {
        if (!restaurantTableBody) return;
        
        restaurantTableBody.innerHTML = '';
        
        if (restaurants.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="text-center py-4 text-gray-500">No restaurants found</td>
            `;
            restaurantTableBody.appendChild(row);
            return;
        }
        
        restaurants.forEach((restaurant) => {
            const row = document.createElement('tr');
            
            // Format date
            const createdDate = new Date(restaurant.created_at);
            const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
            
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
                editRestaurant(restaurantId, restaurants);
            });
        });
        
        document.querySelectorAll('.delete-restaurant').forEach(btn => {
            btn.addEventListener('click', () => {
                const restaurantId = btn.getAttribute('data-id');
                deleteRestaurant(restaurantId, restaurants);
            });
        });
    }
    
    // Function to update dashboard stats
    function updateDashboardStats(users, restaurants, subscriptions) {
        // Update stats boxes
        const userCountElement = document.querySelector('.stats-box:nth-child(1) .stats-number');
        const restaurantCountElement = document.querySelector('.stats-box:nth-child(2) .stats-number');
        const scanCountElement = document.querySelector('.stats-box:nth-child(3) .stats-number');
        const subscriptionCountElement = document.querySelector('.stats-box:nth-child(4) .stats-number');
        
        if (userCountElement) {
            userCountElement.textContent = users.length.toLocaleString();
        }
        
        if (restaurantCountElement) {
            restaurantCountElement.textContent = restaurants.length.toLocaleString();
        }
        
        if (subscriptionCountElement) {
            subscriptionCountElement.textContent = subscriptions.length.toLocaleString();
        }
        
        // Update subscription dashboard container with a simple dashboard
        if (subscriptionDashboardContainer) {
            // Calculate user stats
            const freeUsers = users.filter(user => !user.subscription_tier || user.subscription_tier === 'FREE' || user.subscription_tier === 'free').length;
            const premiumUsers = users.filter(user => user.subscription_tier === 'PREMIUM' || user.subscription_tier === 'premium').length;
            const teamUsers = users.filter(user => user.subscription_tier === 'TEAM' || user.subscription_tier === 'team').length;
            
            // Calculate financial stats
            const totalRevenue = subscriptions.reduce((total, sub) => total + (parseFloat(sub.amount) || 0), 0);
            const averageRevenuePerUser = users.length > 0 ? (totalRevenue / users.length).toFixed(2) : '0.00';
            
            subscriptionDashboardContainer.innerHTML = `
                <div class="subscription-dashboard">
                    <h3 class="text-xl font-semibold mb-4">Subscription Overview</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-white p-4 rounded-lg shadow">
                            <h4 class="text-lg font-medium mb-3">User Distribution</h4>
                            <div class="flex items-center justify-between mb-2">
                                <span>Free Users:</span>
                                <span class="font-bold">${freeUsers}</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span>Premium Users:</span>
                                <span class="font-bold">${premiumUsers}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>Team Users:</span>
                                <span class="font-bold">${teamUsers}</span>
                            </div>
                        </div>
                        
                        <div class="bg-white p-4 rounded-lg shadow">
                            <h4 class="text-lg font-medium mb-3">Revenue</h4>
                            <div class="flex items-center justify-between mb-2">
                                <span>Monthly Revenue:</span>
                                <span class="font-bold">$${totalRevenue.toFixed(2)}</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span>Avg. Revenue per User:</span>
                                <span class="font-bold">$${averageRevenuePerUser}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>Active Subscriptions:</span>
                                <span class="font-bold">${subscriptions.length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h4 class="text-lg font-medium mb-3">Recent Subscriptions</h4>
                        <table class="w-full">
                            <thead>
                                <tr>
                                    <th class="text-left pb-2">User</th>
                                    <th class="text-left pb-2">Plan</th>
                                    <th class="text-left pb-2">Amount</th>
                                    <th class="text-left pb-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subscriptions.slice(0, 5).map(sub => {
                                    const user = users.find(u => u.id === sub.user_id) || { name: 'Unknown', email: 'unknown@example.com' };
                                    const date = new Date(sub.created_at).toLocaleDateString();
                                    return `
                                        <tr>
                                            <td class="py-2">${user.name}</td>
                                            <td class="py-2">${sub.plan_name}</td>
                                            <td class="py-2">$${parseFloat(sub.amount).toFixed(2)}</td>
                                            <td class="py-2">${date}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    }
    
    // Function to edit user
    function editUser(userId, users, restaurants) {
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
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
                            <option value="premium" ${user.subscription_tier === 'premium' ? 'selected' : ''}>Premium</option>
                            <option value="team" ${user.subscription_tier === 'team' ? 'selected' : ''}>Team</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="cancel-user-btn" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking on X
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking on Cancel
        modal.querySelector('#cancel-user-btn').addEventListener('click', () => {
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
                
                // Update user in local array
                const index = users.findIndex(u => u.id === userId);
                if (index !== -1) {
                    users[index] = { ...users[index], ...updatedUser };
                    updateUserTable(users);
                }
                
                // Close modal
                document.body.removeChild(modal);
                
                // Show success message
                alert('User updated successfully');
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Failed to update user. Please try again later.');
            }
        });
    }
    
    // Function to delete user
    function deleteUser(userId, users) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            // Delete user from Firestore
            deleteDoc(doc(db, 'users', userId))
                .then(() => {
                    // Remove user from local array
                    const index = users.findIndex(u => u.id === userId);
                    if (index !== -1) {
                        users.splice(index, 1);
                        updateUserTable(users);
                    }
                    
                    // Show success message
                    alert('User deleted successfully');
                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user. Please try again later.');
                });
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again later.');
        }
    }
    
    // Function to edit restaurant
    function editRestaurant(restaurantId, restaurants) {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        
        if (!restaurant) {
            alert('Restaurant not found');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Edit Restaurant</h2>
                <form id="edit-restaurant-form">
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" name="name" value="${restaurant.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-type">Type</label>
                        <select id="edit-type" name="type" required>
                            <option value="restaurant" ${restaurant.type === 'restaurant' ? 'selected' : ''}>Restaurant</option>
                            <option value="bar" ${restaurant.type === 'bar' ? 'selected' : ''}>Bar</option>
                            <option value="cafe" ${restaurant.type === 'cafe' ? 'selected' : ''}>Cafe</option>
                            <option value="pub" ${restaurant.type === 'pub' ? 'selected' : ''}>Pub</option>
                        </select>
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
                    <div class="form-actions">
                        <button type="button" id="cancel-restaurant-btn" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking on X
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking on Cancel
        modal.querySelector('#cancel-restaurant-btn').addEventListener('click', () => {
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
                type: formData.get('type'),
                address: formData.get('address'),
                phone: formData.get('phone'),
                email: formData.get('email')
            };
            
            try {
                // Update restaurant in Firestore
                await updateDoc(doc(db, 'workplaces', restaurantId), updatedRestaurant);
                
                // Update restaurant in local array
                const index = restaurants.findIndex(r => r.id === restaurantId);
                if (index !== -1) {
                    restaurants[index] = { ...restaurants[index], ...updatedRestaurant };
                    updateRestaurantTable(restaurants);
                }
                
                // Close modal
                document.body.removeChild(modal);
                
                // Show success message
                alert('Restaurant updated successfully');
            } catch (error) {
                console.error('Error updating restaurant:', error);
                alert('Failed to update restaurant. Please try again later.');
            }
        });
    }
    
    // Function to delete restaurant
    function deleteRestaurant(restaurantId, restaurants) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this restaurant?')) {
            return;
        }
        
        try {
            // Delete restaurant from Firestore
            deleteDoc(doc(db, 'workplaces', restaurantId))
                .then(() => {
                    // Remove restaurant from local array
                    const index = restaurants.findIndex(r => r.id === restaurantId);
                    if (index !== -1) {
                        restaurants.splice(index, 1);
                        updateRestaurantTable(restaurants);
                    }
                    
                    // Show success message
                    alert('Restaurant deleted successfully');
                })
                .catch(error => {
                    console.error('Error deleting restaurant:', error);
                    alert('Failed to delete restaurant. Please try again later.');
                });
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            alert('Failed to delete restaurant. Please try again later.');
        }
    }
});
