import mongoose from 'mongoose';
import Product from './models/Product.js';
import 'dotenv/config';

const sampleProducts = [
  {
    sku: "TS001",
    name: "Premium Cotton T-Shirt",
    description: "Soft 100% cotton crew neck t-shirt",
    price: 29.99,
    category: "Apparel",
    images: [
      "https://example.com/images/tshirt1.jpg",
      "https://example.com/images/tshirt2.jpg"
    ],
    slug: "premium-cotton-tshirt",
    attributes: {
      sizes: ["S", "M", "L", "XL"],
      colors: ["white", "black", "navy"],
      material: "cotton"
    },
    metaSEO: {
      title: "Premium Cotton T-Shirt | Best Quality Apparel",
      description: "Shop our premium quality cotton t-shirts in various colors and sizes",
      keywords: ["t-shirt", "cotton", "apparel"]
    }
  },
  {
    sku: "WB002",
    name: "Stainless Steel Water Bottle",
    price: 24.95,
    category: "Kitchenware",
    enabled: false,
    slug: "stainless-water-bottle",
    attributes: {
      capacity: "750ml",
      insulation: "Double-walled",
      material: "Stainless Steel"
    },
    metaSEO: {
      title: "Insulated Water Bottle | Stainless Steel",
      keywords: ["water bottle", "eco-friendly", "hydration"]
    }
  },
  {
    sku: "BP003",
    name: "Hiking Backpack Pro",
    description: "35L weather-resistant hiking backpack",
    price: 149.99,
    category: "Outdoor Gear",
    images: ["https://example.com/images/backpack1.jpg"],
    slug: "hiking-backpack-pro",
    attributes: {
      capacity: "35 liters",
      weight: "1.2kg",
      features: ["waterproof", "hip belt", "multiple compartments"]
    },
    metaSEO: {
      title: "Professional Hiking Backpack | Outdoor Gear",
      description: "Durable 35L hiking backpack with weather-resistant features"
    }
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    console.log('Database seeded!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDB();
