export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware/route handler
    return next();
  } else {
    // User is not authenticated, return a 401 Unauthorized error
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
