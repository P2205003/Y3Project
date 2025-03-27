import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateProductNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get products without productNumber
    const products = await Product.find({ productNumber: { $exists: false } });

    console.log(`Found ${products.length} products without product numbers`);

    // Process each product
    let count = 0;
    for (const product of products) {
      // Generate a product number
      const productNumber = await Product.generateProductNumber();

      // Update the product
      await Product.findByIdAndUpdate(product._id, { productNumber });

      count++;
      console.log(`Updated product ${count}/${products.length}: ${product.name} → ${productNumber}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

migrateProductNumbers();
