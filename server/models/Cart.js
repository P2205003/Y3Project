// server/models/Cart.js
import mongoose from 'mongoose';

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
  name: String,
  price: Number,
  image: String,
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Calculate total price of cart
cartSchema.methods.calculateTotal = function () {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
