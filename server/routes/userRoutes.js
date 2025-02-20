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
    // 1. Get Username and Password
    const { username, password } = req.body;

    // 2. Find User by Username
    const user = await User.findOne({ username });

    // 3. User Not Found
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Compare Passwords
    const isMatch = await user.comparePassword(password);

    // 5. Incorrect Password
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 6. Create Session (Store User ID)
    req.session.userId = user._id;

    // 7. Respond with Success
    res.status(200).json({ message: 'Login successful', user: { username: user.username, fullName: user.fullName } }); // Send limited user data

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
          res.json({ isLoggedIn: true, user: { username: user.username, fullName: user.fullName } });
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
