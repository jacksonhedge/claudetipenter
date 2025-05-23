/**
 * Date Utilities for TipEnter
 * Provides consistent date handling functions for the application
 */

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
function formatDateForDisplay(date, options = {}) {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Default options
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: options.includeTime ? 'short' : undefined
  };
  
  // Merge options
  const formattingOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.DateTimeFormat('en-US', formattingOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date for Supabase queries (ISO format with timezone)
 * @param {string|Date} date - Date to format
 * @param {boolean} endOfDay - Whether to set time to end of day (23:59:59.999)
 * @returns {string} - ISO formatted date string
 */
function formatDateForSupabase(date, endOfDay = false) {
  if (!date) return null;
  
  let dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // If endOfDay is true, set the time to 23:59:59.999
  if (endOfDay) {
    dateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
  } else {
    // Otherwise, set the time to 00:00:00.000
    dateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  }
  
  return dateObj.toISOString();
}

/**
 * Get a date range based on a predefined range name
 * @param {string} rangeName - Name of the date range (today, yesterday, last7days, thisMonth, lastMonth, custom)
 * @param {object} customRange - Custom date range (startDate, endDate)
 * @returns {object} - Date range object with startDate and endDate
 */
function getDateRange(rangeName, customRange = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate, endDate;
  
  switch (rangeName) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'last7days':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'custom':
      if (customRange.startDate) {
        startDate = typeof customRange.startDate === 'string' 
          ? new Date(customRange.startDate) 
          : customRange.startDate;
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
      }
      
      if (customRange.endDate) {
        endDate = typeof customRange.endDate === 'string' 
          ? new Date(customRange.endDate) 
          : customRange.endDate;
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
      
    default:
      // Default to last 7 days
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
  }
  
  return {
    startDate,
    endDate
  };
}

/**
 * Get receipts by date range
 * @param {object} supabase - Supabase client
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options (limit, offset, etc.)
 * @returns {Promise<object>} - Query result with receipts
 */
function getReceiptsByDateRange(supabase, startDate, endDate, options = {}) {
  try {
    // Format dates for Supabase
    const formattedStartDate = formatDateForSupabase(startDate);
    const formattedEndDate = formatDateForSupabase(endDate, true);
    
    console.log(`Fetching receipts from ${formattedStartDate} to ${formattedEndDate}`);
    
    // Build query
    let query = supabase
      .from('receipts')
      .select('*');
    
    // Add date range filter
    if (formattedStartDate && formattedEndDate) {
      query = query
        .gte('created_at', formattedStartDate)
        .lte('created_at', formattedEndDate);
    }
    
    // Add status filter if provided
    if (options.status) {
      if (options.status === 'pending') {
        query = query.is('approval_status', null);
      } else {
        query = query.eq('approval_status', options.status);
      }
    }
    
    // Add user filter if provided
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    
    // Add establishment filter if provided
    if (options.establishment) {
      // This assumes you have a join with profiles or the establishment is stored directly
      query = query.eq('establishment', options.establishment);
    }
    
    // Add order by
    query = query.order('created_at', { ascending: options.ascending || false });
    
    // Add pagination
    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }
    
    // Execute query
    return query;
  } catch (error) {
    console.error('Error getting receipts by date range:', error);
    return { 
      success: false, 
      error: error.message,
      receipts: []
    };
  }
}
