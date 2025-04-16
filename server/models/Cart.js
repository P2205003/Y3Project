// server/models/Cart.js
import mongoose from 'mongoose';

// --- Cart Item Schema (Minimal) ---
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Store base attributes (assuming English keys from frontend)
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed // Store selected value (e.g., "Oak", "Large")
  }
}, { _id: false });
// --- End Cart Item Schema ---

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema], // Use the minimal schema
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Remove the calculateTotal method here, as price needs to be fetched dynamically
// cartSchema.methods.calculateTotal = function () { ... };

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
