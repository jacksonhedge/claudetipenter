/**
 * Subscription Middleware
 * Authentication and subscription enforcement middleware
 */

const jwt = require('jsonwebtoken');
const { User, Subscription, SubscriptionLimit } = require('../models/index');

// Subscription tier limits
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    scanLimit: 15,
    printerLimit: 1,
    features: ['basic_analytics', 'manual_export']
  },
  PREMIUM: {
    name: 'Premium',
    scanLimit: -1, // Unlimited
    printerLimit: 3,
    features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'priority_support']
  },
  TEAM: {
    name: 'Team',
    scanLimit: -1, // Unlimited
    printerLimit: 5,
    features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'priority_support', 'team_analytics', 'multi_user']
  }
};

/**
 * Verify user authentication using JWT
 */
const verifyAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User not found'
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Update last login time
    user.last_login = new Date();
    await user.save();
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid token'
    });
  }
};

/**
 * Verify user has admin role
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // First verify authentication
    await verifyAuth(req, res, () => {
      // Check if user has admin role
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Forbidden - Admin access required'
        });
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Check if user has access to a specific feature
 * @param {string} feature - Feature to check access for
 */
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      // First verify authentication
      await verifyAuth(req, res, async () => {
        // Get user subscription
        const subscription = await Subscription.findOne({ user: req.user._id });
        
        // Default to FREE tier if no subscription found
        const currentTier = subscription ? subscription.tier : 'FREE';
        const tierDetails = SUBSCRIPTION_TIERS[currentTier];
        
        // Check if the tier includes the requested feature
        if (tierDetails.features.includes(feature)) {
          next();
        } else {
          res.status(403).json({
            success: false,
            error: 'Feature not available',
            message: 'This feature requires a higher subscription tier',
            current_tier: currentTier,
            required_feature: feature
          });
        }
      });
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
};

/**
 * Check if user has scans available
 */
const checkScanAvailability = async (req, res, next) => {
  try {
    // First verify authentication
    await verifyAuth(req, res, async () => {
      // Get scan count from request or default to 1
      const scanCount = req.body.scan_count || 1;
      
      // Get user subscription
      const subscription = await Subscription.findOne({ user: req.user._id });
      
      // Default to FREE tier if no subscription found
      const currentTier = subscription ? subscription.tier : 'FREE';
      let scanLimit = SUBSCRIPTION_TIERS[currentTier].scanLimit;
      
      // If user is on FREE tier, check for custom scan limit
      if (currentTier === 'FREE') {
        const subscriptionLimit = await SubscriptionLimit.findOne({ user: req.user._id });
        
        if (subscriptionLimit) {
          scanLimit = subscriptionLimit.scan_limit;
        }
      }
      
      // Unlimited scans
      if (scanLimit === -1) {
        next();
        return;
      }
      
      // Check if user has enough scans available
      if (req.user.scan_count + scanCount <= scanLimit) {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Scan limit exceeded',
          scan_count: req.user.scan_count,
          scan_limit: scanLimit,
          remaining: Math.max(0, scanLimit - req.user.scan_count),
          requested: scanCount
        });
      }
    });
  } catch (error) {
    console.error('Scan availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Check if user can connect more printers
 */
const checkPrinterLimit = async (req, res, next) => {
  try {
    // First verify authentication
    await verifyAuth(req, res, async () => {
      // Get user's current printer connections (this would come from your printer service)
      const currentPrinterCount = req.body.current_printer_count || 0;
      
      // Get user subscription
      const subscription = await Subscription.findOne({ user: req.user._id });
      
      // Default to FREE tier if no subscription found
      const currentTier = subscription ? subscription.tier : 'FREE';
      const printerLimit = SUBSCRIPTION_TIERS[currentTier].printerLimit;
      
      // Check if user can connect more printers
      if (currentPrinterCount < printerLimit) {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Printer limit exceeded',
          current_count: currentPrinterCount,
          printer_limit: printerLimit
        });
      }
    });
  } catch (error) {
    console.error('Printer limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  verifyAuth,
  verifyAdmin,
  checkFeatureAccess,
  checkScanAvailability,
  checkPrinterLimit
};
