import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create new order from cart
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get user info for shipping address
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get cart
    let cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount (in case it's not provided)
    const totalAmount = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Generate unique order number
    const orderNumber = await Order.generateOrderNumber();

    // Create order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      image: item.image
    }));

    // Create new order
    const newOrder = new Order({
      orderNumber,
      userId,
      items: orderItems,
      shippingAddress: req.body.shippingAddress || user.shippingAddress,
      totalAmount,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedBy: {
          userId,
          username: user.username
        },
        notes: 'Order created'
      }]
    });

    // Save order
    await newOrder.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all orders for current user with optional status filter
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders
    const orders = await Order.find(query)
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific order details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    const user = await User.findById(userId);
    if (order.userId.toString() !== userId && !user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status - Only admins can update status
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Get user info for history tracking
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    try {
      // Update status with validation
      order.updateStatus(status, userId, user.username, notes);
      await order.save();

      res.json(order);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW ROUTE: Cancel order - Users can cancel their own orders
router.patch('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { reason } = req.body;

    // Get user info for history tracking
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.userId.toString() !== userId && !user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if order can be cancelled
    const allowedTransitions = ['pending', 'hold']; // Orders in these statuses can be cancelled
    if (!allowedTransitions.includes(order.status)) {
      return res.status(400).json({
        message: `Orders in '${order.status}' status cannot be cancelled`
      });
    }

    // Prepare notes
    const notes = reason
      ? `Cancelled by customer. Reason: ${reason}`
      : 'Cancelled by customer';

    try {
      // Update status with validation
      order.updateStatus('cancelled', userId, user.username, notes);
      await order.save();

      res.json(order);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all orders
router.get('/admin/all', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders
    const orders = await Order.find(query)
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
