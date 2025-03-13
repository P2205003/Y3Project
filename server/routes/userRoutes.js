import express from 'express';
import User from '../models/User.js'; // Import the User model
import bcrypt from 'bcrypt';

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
router.post('/login', async (req, res) => {
  try {
    // Check if the user is ALREADY logged in
    if (req.session && req.session.userId) {
      // User is already logged in.  Return user info.
      const user = await User.findById(req.session.userId);
      if (user) {
        return res.status(200).json({
          message: 'Already logged in',
          user: { username: user.username, fullName: user.fullName },
        });
      } else {
        // This shouldn't happen, but handle it gracefully
        return res.status(401).json({ message: 'Invalid session' });
      }
    }

    // If not already logged in, proceed with normal login
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.status(200).json({ message: 'Login successful', user: { username: user.username, fullName: user.fullName } });

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
    // User is logged in, send back user info
    User.findById(req.session.userId)
      .then(user => {
        if (user) {
          res.json({
            isLoggedIn: true,
            user: {
              username: user.username,
              fullName: user.fullName,
              shippingAddress: user.shippingAddress  // Add this line
            }
          });
        } else {
          // Session exists, but user not found (shouldn't happen normally)
          res.status(401).json({ isLoggedIn: false });
        }
      })
      .catch(err => {
        console.error("Error finding user:", err);
        res.status(500).json({ message: 'server error' })
      });
  } else {
    // User is not logged in
    res.json({ isLoggedIn: false });
  }
});

export default router;
