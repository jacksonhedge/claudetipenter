import React, { useState, useEffect } from 'react';
// Use lucide icons from global lucide object instead of importing from lucide-react
const { Search, RefreshCw, Edit, User, Gift, MoreHorizontal, Filter, Download, ArrowUpDown } = lucide;

const AdminUserManagement = (props) => {
  const [users, setUsers] = useState(props.users || []);
  const [loading, setLoading] = useState(!props.users || props.users.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortField, setSortField] = useState('last_login');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showAddScansModal, setShowAddScansModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scansToAdd, setScansToAdd] = useState(5);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Get data service from props or global context
  const dataService = props.dataService || (window.AdminContext ? window.AdminContext.dataService : null);

  // Fetch users if not provided in props
  useEffect(() => {
    const fetchUsers = async () => {
      if (props.users && props.users.length > 0) {
        setUsers(props.users);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (dataService) {
          const fetchedUsers = await dataService.getUsers();
          setUsers(fetchedUsers);
        } else {
          console.error('No data service available');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [props.users, dataService]);

  // Filter users based on search term and selected filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'free') return matchesSearch && user.subscription_tier === 'FREE';
    if (selectedFilter === 'premium') return matchesSearch && user.subscription_tier === 'PREMIUM';
    if (selectedFilter === 'team') return matchesSearch && user.subscription_tier === 'TEAM';
    
    return matchesSearch;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'subscription_tier':
        aValue = a.subscription_tier;
        bValue = b.subscription_tier;
        break;
      case 'scan_count':
        aValue = a.scan_count;
        bValue = b.scan_count;
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'last_login':
        aValue = new Date(a.last_login);
        bValue = new Date(b.last_login);
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Handle sort change
  const handleSortChange = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle add scans
  const handleAddScans = async () => {
    if (!selectedUser || scansToAdd <= 0) return;
    
    try {
      if (!dataService) {
        throw new Error('Data service not available');
      }
      
      // Update user with new scan count
      const updatedUser = {
        ...selectedUser,
        scan_count: (selectedUser.scan_count || 0) + scansToAdd,
        // Increase scan limit for free users
        scan_limit: selectedUser.subscription_tier === 'FREE' ? 
          Math.max((selectedUser.scan_limit || 15), (selectedUser.scan_count || 0) + scansToAdd) : 
          selectedUser.scan_limit
      };
      
      // Update user in Firebase
      await dataService.updateUser(selectedUser.id, {
        scan_count: updatedUser.scan_count,
        scan_limit: updatedUser.scan_limit
      });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      ));
      
      setActionSuccess({
        message: `Successfully added ${scansToAdd} scans to ${selectedUser.name}`,
        type: 'success'
      });
      
      // Close modal and reset
      setShowAddScansModal(false);
      setSelectedUser(null);
      setScansToAdd(5);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('Error adding scans:', error);
      setActionSuccess({
        message: `Error adding scans: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get subscription badge class
  const getSubscriptionBadgeClass = (tier) => {
    switch (tier) {
      case 'FREE':
        return 'bg-blue-100 text-blue-800';
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800';
      case 'TEAM':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">User Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="team">Team</option>
            </select>
            
            <button 
              onClick={() => window.location.reload()}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Success/Error Message */}
      {actionSuccess && (
        <div className={`mb-4 p-3 rounded-md ${actionSuccess.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {actionSuccess.message}
        </div>
      )}
      
      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('name')}>
                <div className="flex items-center">
                  User
                  {sortField === 'name' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('subscription_tier')}>
                <div className="flex items-center">
                  Plan
                  {sortField === 'subscription_tier' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('scan_count')}>
                <div className="flex items-center">
                  Scans
                  {sortField === 'scan_count' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('created_at')}>
                <div className="flex items-center">
                  Joined
                  {sortField === 'created_at' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('last_login')}>
                <div className="flex items-center">
                  Last Active
                  {sortField === 'last_login' && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 transform rotate-180'}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionBadgeClass(user.subscription_tier)}`}>
                      {user.subscription_tier === 'FREE' ? 'Free' : 
                       user.subscription_tier === 'PREMIUM' ? 'Premium' : 'Team'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.scan_count} / {user.scan_limit === -1 ? '∞' : user.scan_limit}
                    </div>
                    {user.subscription_tier === 'FREE' && user.scan_count >= user.scan_limit && (
                      <div className="text-xs text-red-500">Limit reached</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAddScansModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Add Complimentary Scans"
                      >
                        <Gift className="h-5 w-5" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit User"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="More Options"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Scans Modal */}
      {showAddScansModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              Add Complimentary Scans
            </h3>
            <p className="text-gray-600 mb-4">
              Add complimentary scans to <span className="font-medium">{selectedUser.name}</span>'s account.
            </p>
            
            <div className="mb-4">
              <label htmlFor="scansToAdd" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Scans
              </label>
              <input
                type="number"
                id="scansToAdd"
                min="1"
                max="100"
                value={scansToAdd}
                onChange={(e) => setScansToAdd(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm mb-4">
              <div className="font-medium">Current Usage:</div>
              <div>Scans: {selectedUser.scan_count} / {selectedUser.scan_limit === -1 ? '∞' : selectedUser.scan_limit}</div>
              <div>Plan: {selectedUser.subscription_tier === 'FREE' ? 'Free' : 
                         selectedUser.subscription_tier === 'PREMIUM' ? 'Premium' : 'Team'}</div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddScansModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScans}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <Gift className="w-4 h-4 inline-block mr-1" />
                Add Scans
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Export and Bulk Actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <p className="text-sm text-gray-500">
            Showing {sortedUsers.length} of {users.length} users
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
