import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js'; // Import user routes
import { isAuthenticated } from './middleware/auth.js'; // Import authentication middleware
import session from 'express-session';
import MongoStore from 'connect-mongo';
import 'dotenv/config'; // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET, // Use a strong, random secret in .env
  resave: false, // Don't save the session if it wasn't modified
  saveUninitialized: false, // Don't create a session until something is stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
    collectionName: 'sessions' // Optional: Specify a collection name for sessions
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true in production (HTTPS)
    maxAge: 1000 * 60 * 60 * 24 * 7 // Example: 7 days (milliseconds)
  }
}));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes); // Use user routes

// --- Example Protected Route (Requires Authentication) ---
app.get('/api/protected', isAuthenticated, (req, res) => {
  // If the isAuthenticated middleware passes, this code will execute.
  // You can access the user's ID from req.session.userId here.
  res.json({ message: 'This is a protected route. You are logged in!', userId: req.session.userId });
});

// Error handling middleware (keep this at the end)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
