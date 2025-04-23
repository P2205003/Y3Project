// server/routes/adminRoutes.js
import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// --- GET /api/admin/stats ---
// Retrieves dashboard statistics (requires admin privileges)
router.get('/stats', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    // 1. Total Orders
    const totalOrders = await Order.countDocuments({});

    // 2. Total Revenue (Sum of totalAmount for all orders)
    // Note: You might want to filter this later (e.g., exclude 'cancelled' orders)
    // For now, we sum all orders.
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null, // Group all documents together
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    // revenueResult will be an array like [{ _id: null, totalRevenue: 12345.67 }]
    // If no orders exist, it will be an empty array.
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;


    // 3. Active Products (Using the 'enabled' field from your Product model)
    const activeProducts = await Product.countDocuments({ enabled: true });

    // 4. Total Users
    const totalUsers = await User.countDocuments({});

    // Send the aggregated stats
    res.json({
      totalOrders,
      totalRevenue,
      activeProducts,
      totalUsers
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    // Pass error to the central error handler in index.js
    next(error);
  }
});


// --- Add other admin-specific routes here later if needed ---
// Example: router.get('/reports/sales', isAuthenticated, isAdmin, ...)

export default router;
