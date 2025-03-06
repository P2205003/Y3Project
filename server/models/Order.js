// server/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  },
  image: String
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'shipped', 'cancelled', 'hold', 'delivered'],
    required: true
  },
  changedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'cancelled', 'hold', 'delivered'],
    default: 'pending'
  },
  statusDates: {
    created: { type: Date, default: Date.now },
    shipped: Date,
    cancelled: Date,
    hold: Date,
    delivered: Date
  },
  statusHistory: [statusHistorySchema],
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate a unique order number
orderSchema.statics.generateOrderNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const prefix = `ORD-${year}${month}${day}-`;

  // Find the highest existing order number for today
  const latestOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}`)
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (latestOrder) {
    const latestSequence = parseInt(latestOrder.orderNumber.split('-')[2]);
    if (!isNaN(latestSequence)) {
      sequence = latestSequence + 1;
    }
  }

  return `${prefix}${('000' + sequence).slice(-4)}`;
};

// Helper method to update status with validation
orderSchema.methods.updateStatus = function (newStatus, userId, username, notes = '') {
  // Define valid transitions
  const validTransitions = {
    'pending': ['shipped', 'cancelled', 'hold'],
    'hold': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'cancelled': [],
    'delivered': []
  };

  // Check if transition is valid
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  // Update status
  this.status = newStatus;
  this.statusDates[newStatus] = new Date();

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedBy: {
      userId,
      username
    },
    date: new Date(),
    notes
  });

  return this;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
