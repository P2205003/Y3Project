export const isAuthenticated = (req, res, next) => {
  console.log('Auth check - Session data:', {
    sessionExists: !!req.session,
    userId: req.session?.userId,
    sessionID: req.sessionID,
    cookies: req.headers.cookie
  });

  if (req.session && req.session.userId) {
    console.log(`User authenticated: ${req.session.userId}`);
    return next();
  }

  console.log('Authentication failed - no valid session');
  return res.status(401).json({ message: 'Unauthorized - Please log in' });
};

export const isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }

  try {
    // Import User model dynamically to avoid circular dependencies
    const { default: User } = await import('../models/User.js');

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }

    // Check if user has admin role
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Server error during admin check' });
  }
};
