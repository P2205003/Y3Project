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
