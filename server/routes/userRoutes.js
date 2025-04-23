import express from 'express';
import User from '../models/User.js'; // Import the User model
import bcrypt from 'bcrypt';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- Registration Route ---
router.post('/register', async (req, res) => {
  try {
    // 1. Input Validation (Basic - you can expand this)
    const { username, password, fullName, email, shippingAddress } = req.body;

    if (!username || !password || !fullName || !email || !shippingAddress) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Check for Existing User (Username and Email)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // 3. Create New User (Password will be hashed in the User model's pre-save hook)
    const newUser = new User({
      username,
      password, // This will be hashed by the pre-save hook
      fullName,
      email,
      shippingAddress,
    });

    // 4. Save User to Database
    await newUser.save();

    // 5. Respond with Success (Do NOT send back the password hash!)
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: 'Server error during registration', error: error.message }); // More detailed error for debugging
  }
});

// --- Login Route ---
// --- Login Route --- (MODIFY THIS)
router.post('/login', async (req, res) => {
  try {
    // Check if the user is ALREADY logged in
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        return res.status(200).json({
          message: 'Already logged in',
          user: {
            // --- ADD _id HERE ---
            _id: user._id,
            // --- END ADD ---
            username: user.username,
            fullName: user.fullName,
            shippingAddress: user.shippingAddress // Keep this if needed by App.vue/Header
          },
        });
      } else {
        req.session.destroy(); // Clean up invalid session
        return res.status(401).json({ message: 'Invalid session data.' });
      }
    }

    // If not already logged in, proceed with normal login
    const { username, password } = req.body;

    // --- INPUT VALIDATION ---
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user by username (case-insensitive for login convenience)
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      // Use generic message for security
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Use generic message
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Regenerate session for security (optional but good practice)
    /*
    req.session.regenerate(async (err) => {
        if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: 'Server error during login session.', error: err.message });
        }
        // Store user ID in the new session
        req.session.userId = user._id;
        // Send response AFTER session is saved
         res.status(200).json({
             message: 'Login successful',
             user: {
                 // --- INCLUDE _id IN RESPONSE ---
                 _id: user._id,
                 // --- END INCLUDE ---
                 username: user.username,
                 fullName: user.fullName,
                 shippingAddress: user.shippingAddress // Include if needed
             }
         });
    });
    */
    // --- Simpler session setup (without regenerate) ---
    req.session.userId = user._id;
    req.session.save(err => { // Ensure session is saved before responding
        if(err){
             console.error("Session save error:", err);
             return res.status(500).json({ message: 'Server error during login session save.', error: err.message });
        }
        // Send response AFTER session is saved
        res.status(200).json({
            message: 'Login successful',
            user: {
                // --- INCLUDE _id IN RESPONSE ---
                _id: user._id,
                // --- END INCLUDE ---
                username: user.username,
                fullName: user.fullName,
                shippingAddress: user.shippingAddress // Include if needed
            }
        });
    });
    // --- End Simpler session setup ---

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// --- Logout Route ---
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: 'Server error during logout' });
      } else {
        res.status(200).json({ message: 'Logout successful' });
      }
    });
  } else {
    // Technically, they weren't logged in, but we'll treat it as a successful logout
    res.status(200).json({ message: 'Logout successful' });
  }
});

// --- Check Login Status Route ---
router.get('/check-login', (req, res) => {
  if (req.session && req.session.userId) {
    User.findById(req.session.userId)
      .select('_id username fullName shippingAddress') // Explicitly select fields needed
      .then(user => {
        if (user) {
          res.json({
            isLoggedIn: true,
            user: {
              // --- INCLUDE _id ---
              _id: user._id,
              // --- END INCLUDE ---
              username: user.username,
              fullName: user.fullName,
              shippingAddress: user.shippingAddress
            }
          });
        } else {
          // Session exists, but user not found
          req.session.destroy(); // Clean up invalid session
          res.status(401).json({ isLoggedIn: false });
        }
      })
      .catch(err => {
        console.error("Error finding user during check-login:", err);
        res.status(500).json({ message: 'Server error checking login status' })
      });
  } else {
    res.json({ isLoggedIn: false });
  }
});

// --- Check Admin Status Route ---
router.get('/check-admin', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ isAdmin: false, message: 'User not found' });
    }

    res.json({ isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ isAdmin: false, message: 'Server error checking admin status' });
  }
});

// --- Admin-Only Route Example ---
router.get('/admin-data', isAuthenticated, isAdmin, (req, res) => {
  res.json({ message: 'Admin data access granted', adminData: { /* data here */ } });
});

export default router;
