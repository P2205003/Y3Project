import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  enabled: { type: Boolean, default: true },
  images: [String],
  slug: { type: String, unique: true },
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metaSEO: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
