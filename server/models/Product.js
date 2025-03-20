import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  enabled: { type: Boolean, default: true },
  images: [String],
  slug: { type: String, unique: true },
  productNumber: {
    type: String,
    required: true,
    unique: true
  },
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metaSEO: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Static method to generate product number (similar to Order)
productSchema.statics.generateProductNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `PRO-${year}${month}${day}-`;

  const latestProduct = await this.findOne({
    productNumber: { $regex: `^${prefix}` }
  }).sort({ productNumber: -1 });

  let sequence = 1;
  if (latestProduct) {
    const lastNumber = latestProduct.productNumber.split('-')[2];
    sequence = parseInt(lastNumber, 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

export default mongoose.model('Product', productSchema);
