/**
 * Role-Based Access Control Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

/**
 * Check if the user is the owner of the resource or has staff privileges (admin, operations, support)
 */
const checkResourceAccess = (ownerIdExtractor) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Admins and Operations staff have platform-wide access
    if (['admin', 'operations', 'support'].includes(req.user.role)) {
      return next();
    }

    const ownerId = ownerIdExtractor(req);
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this resource'
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  checkResourceAccess
};
