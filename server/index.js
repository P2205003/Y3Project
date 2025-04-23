import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Import Routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Import Middleware
import { isAuthenticated } from './middleware/auth.js';

const app = express();

// --- Determine __dirname for static path ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- Session Configuration --- (Keep existing)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Request error logging middleware (Keep existing)
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.log(`Error ${res.statusCode} for ${req.method} ${req.url}`);
    }
  });
  next();
});

// --- Static File Serving ---
// Serve files from 'public/uploads' directory at the '/uploads' URL path
// This makes files in public/uploads/images accessible via http://yourserver.com/uploads/images/filename.jpg
const publicUploadsPath = path.join(__dirname, '..', 'public', 'uploads');
console.log(`Serving static files from ${publicUploadsPath} at /uploads`);
app.use('/uploads', express.static(publicUploadsPath));

// --- Routes ---
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// --- Example Protected Route --- (Keep existing)
app.get('/api/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'This is a protected route. You are logged in!', userId: req.session.userId });
});

// Error handling middleware (Keep existing)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ // Use err.status if available
    message: err.message || 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
