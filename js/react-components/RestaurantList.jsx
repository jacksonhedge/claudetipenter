import React, { useState, useEffect } from 'react';

const RestaurantList = (props) => {
  const [restaurantData, setRestaurantData] = useState(props.restaurants || []);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(!props.restaurants || props.restaurants.length === 0);
  const [newRestaurant, setNewRestaurant] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Get data service from props or global context
  const dataService = props.dataService || (window.AdminContext ? window.AdminContext.dataService : null);
  
  // Process restaurant data from Firebase into simple name list
  useEffect(() => {
    if (restaurantData && restaurantData.length > 0) {
      // Extract restaurant names from the data
      const names = restaurantData.map(restaurant => restaurant.name || 'Unnamed Restaurant');
      setRestaurants(names);
      setLoading(false);
    }
  }, [restaurantData]);
  
  // Fetch restaurants if not provided in props
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (props.restaurants && props.restaurants.length > 0) {
        setRestaurantData(props.restaurants);
        return;
      }
      
      setLoading(true);
      try {
        if (dataService) {
          const fetchedRestaurants = await dataService.getRestaurants();
          setRestaurantData(fetchedRestaurants);
        } else {
          console.error('No data service available');
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, [props.restaurants, dataService]);

  const handleAddRestaurant = async () => {
    if (newRestaurant.trim()) {
      try {
        if (dataService) {
          // Create a new restaurant object
          const newRestaurantData = {
            name: newRestaurant.trim(),
            type: 'restaurant',
            created_at: new Date().toISOString()
          };
          
          // Add to Firebase
          await dataService.addRestaurant(newRestaurantData);
          
          // Update local state
          const newRestaurantDataWithId = {
            ...newRestaurantData,
            id: `temp-${Date.now()}` // Temporary ID until we refresh
          };
          
          setRestaurantData([...restaurantData, newRestaurantDataWithId]);
          setRestaurants([...restaurants, newRestaurant.trim()]);
          setNewRestaurant('');
          
          // Refresh data from Firebase to get the real ID
          const refreshedRestaurants = await dataService.getRestaurants();
          setRestaurantData(refreshedRestaurants);
        } else {
          // Fallback if no data service
          setRestaurants([...restaurants, newRestaurant.trim()]);
          setNewRestaurant('');
        }
      } catch (error) {
        console.error('Error adding restaurant:', error);
        alert('Failed to add restaurant. Please try again.');
      }
    }
  };

  const handleRemoveRestaurant = async (index) => {
    try {
      if (dataService && restaurantData[index]) {
        // Remove from Firebase
        await dataService.deleteRestaurant(restaurantData[index].id);
        
        // Update local state
        const updatedRestaurantData = [...restaurantData];
        updatedRestaurantData.splice(index, 1);
        setRestaurantData(updatedRestaurantData);
        
        const updatedRestaurants = [...restaurants];
        updatedRestaurants.splice(index, 1);
        setRestaurants(updatedRestaurants);
      } else {
        // Fallback if no data service
        const updatedRestaurants = [...restaurants];
        updatedRestaurants.splice(index, 1);
        setRestaurants(updatedRestaurants);
      }
    } catch (error) {
      console.error('Error removing restaurant:', error);
      alert('Failed to remove restaurant. Please try again.');
    }
  };

  const startEdit = (index) => {
    setEditIndex(index);
    setEditValue(restaurants[index]);
  };

  const saveEdit = async () => {
    if (editValue.trim() && editIndex !== null) {
      try {
        if (dataService && restaurantData[editIndex]) {
          // Update in Firebase
          await dataService.updateRestaurant(restaurantData[editIndex].id, {
            name: editValue.trim()
          });
          
          // Update local state
          const updatedRestaurantData = [...restaurantData];
          updatedRestaurantData[editIndex] = {
            ...updatedRestaurantData[editIndex],
            name: editValue.trim()
          };
          setRestaurantData(updatedRestaurantData);
          
          const updatedRestaurants = [...restaurants];
          updatedRestaurants[editIndex] = editValue.trim();
          setRestaurants(updatedRestaurants);
        } else {
          // Fallback if no data service
          const updatedRestaurants = [...restaurants];
          updatedRestaurants[editIndex] = editValue.trim();
          setRestaurants(updatedRestaurants);
        }
        
        setEditIndex(null);
      } catch (error) {
        console.error('Error updating restaurant:', error);
        alert('Failed to update restaurant. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Restaurant List</h2>
      
      {/* Add new restaurant */}
      <div className="mb-6 flex">
        <input
          type="text"
          value={newRestaurant}
          onChange={(e) => setNewRestaurant(e.target.value)}
          placeholder="Add a new restaurant"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddRestaurant}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      
      {/* Restaurant list */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {restaurants.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">No restaurants added yet</li>
          ) : (
            restaurants.map((restaurant, index) => (
              <li key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                {editIndex === index ? (
                  <div className="flex-grow flex items-center">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-grow px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="ml-2 flex">
                      <button
                        onClick={saveEdit}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800">{restaurant}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(index)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveRestaurant(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>These restaurants will be available for selection in the POS integration.</p>
      </div>
    </div>
  );
};

export default RestaurantList;
