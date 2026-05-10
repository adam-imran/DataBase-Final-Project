require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const Customer     = require('../models/Customer');
const Category     = require('../models/Category');
const Supplier     = require('../models/Supplier');
const Product      = require('../models/Product');
const Order        = require('../models/Order');
const OrderItem    = require('../models/OrderItem');
const Payment      = require('../models/Payment');
const Review       = require('../models/Review');
const InventoryLog = require('../models/InventoryLog');

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const PAYMENT_METHODS = ['Credit Card', 'COD', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];
const ORDER_STATUSES  = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_WEIGHTS  = [0.05, 0.08, 0.12, 0.65, 0.10]; // mostly delivered

function weightedRandom(items, weights) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return items[i];
  }
  return items[items.length - 1];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // clear existing
  await Promise.all([
    Customer.deleteMany({}),
    Category.deleteMany({}),
    Supplier.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    InventoryLog.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // ── Categories ──────────────────────────────────────────────────────────
  const parentCats = await Category.insertMany([
    { name: 'Electronics',    description: 'Phones, laptops, accessories' },
    { name: 'Fashion',        description: 'Clothing, shoes, accessories' },
    { name: 'Home & Living',  description: 'Furniture, kitchen, decor' },
    { name: 'Sports',         description: 'Equipment, gym, outdoor' },
    { name: 'Books',          description: 'Academic, fiction, educational' },
    { name: 'Beauty',         description: 'Skincare, makeup, haircare' },
    { name: 'Groceries',      description: 'Food, beverages, household' },
    { name: 'Automotive',     description: 'Car accessories, tools' },
  ]);

  const subCats = await Category.insertMany([
    { name: 'Smartphones',   parentCategoryId: parentCats[0]._id },
    { name: 'Laptops',       parentCategoryId: parentCats[0]._id },
    { name: 'Accessories',   parentCategoryId: parentCats[0]._id },
    { name: "Men's Clothing", parentCategoryId: parentCats[1]._id },
    { name: "Women's Clothing",parentCategoryId: parentCats[1]._id },
    { name: 'Footwear',      parentCategoryId: parentCats[1]._id },
    { name: 'Kitchen',       parentCategoryId: parentCats[2]._id },
    { name: 'Furniture',     parentCategoryId: parentCats[2]._id },
    { name: 'Gym Equipment', parentCategoryId: parentCats[3]._id },
    { name: 'Fiction',       parentCategoryId: parentCats[4]._id },
  ]);

  const allCategories = [...parentCats, ...subCats];
  console.log(`Created ${allCategories.length} categories`);

  // ── Suppliers ────────────────────────────────────────────────────────────
  const supplierData = [
    { name: 'TechZone Pakistan',   contactEmail: 'orders@techzone.pk',   phone: '051-1234567', address: 'I-9, Islamabad' },
    { name: 'FashionHub Lahore',   contactEmail: 'supply@fashionhub.pk', phone: '042-9876543', address: 'Gulberg III, Lahore' },
    { name: 'HomeStyle Karachi',   contactEmail: 'info@homestylekar.pk', phone: '021-3456789', address: 'SITE, Karachi' },
    { name: 'SportsPro Pakistan',  contactEmail: 'sports@propak.com',    phone: '021-7654321', address: 'Korangi, Karachi' },
    { name: 'BookBazaar Online',   contactEmail: 'books@bookbazaar.pk',  phone: '042-1112223', address: 'Urdu Bazaar, Lahore' },
    { name: 'BeautyLine PK',       contactEmail: 'admin@beautyline.pk',  phone: '021-5556667', address: 'Clifton, Karachi' },
    { name: 'GroceryDirect',       contactEmail: 'bulk@grocerydirect.pk',phone: '051-8889990', address: 'Rawalpindi' },
    { name: 'AutoPartsHub',        contactEmail: 'parts@autohub.pk',     phone: '042-4445556', address: 'Ferozpur Road, Lahore' },
    { name: 'MegaSupplies Co.',    contactEmail: 'mega@supplies.pk',     phone: '021-2223334', address: 'DHA, Karachi' },
    { name: 'PrimeTrade PK',       contactEmail: 'prime@trade.pk',       phone: '051-9990001', address: 'F-6, Islamabad' },
  ];
  const suppliers = await Supplier.insertMany(supplierData);
  console.log(`Created ${suppliers.length} suppliers`);

  // ── Products (1000+) ─────────────────────────────────────────────────────
  const productTemplates = [
    // Electronics
    { prefix: 'Samsung Galaxy',   cat: 'Smartphones',     priceRange: [25000, 120000], sup: 0 },
    { prefix: 'iPhone',           cat: 'Smartphones',     priceRange: [80000, 250000], sup: 0 },
    { prefix: 'Realme',           cat: 'Smartphones',     priceRange: [15000, 45000],  sup: 0 },
    { prefix: 'Dell Laptop',      cat: 'Laptops',         priceRange: [60000, 180000], sup: 0 },
    { prefix: 'HP Laptop',        cat: 'Laptops',         priceRange: [55000, 150000], sup: 0 },
    { prefix: 'USB Cable',        cat: 'Accessories',     priceRange: [200, 1500],     sup: 8 },
    { prefix: 'Phone Cover',      cat: 'Accessories',     priceRange: [150, 800],      sup: 8 },
    // Fashion
    { prefix: 'Shalwar Kameez',   cat: "Men's Clothing",  priceRange: [800, 4500],     sup: 1 },
    { prefix: 'Kurta',            cat: "Women's Clothing", priceRange: [600, 3500],     sup: 1 },
    { prefix: 'Running Shoes',    cat: 'Footwear',        priceRange: [2000, 8000],    sup: 1 },
    { prefix: 'Sandals',          cat: 'Footwear',        priceRange: [500, 3000],     sup: 1 },
    // Home
    { prefix: 'Pressure Cooker',  cat: 'Kitchen',         priceRange: [1500, 6000],    sup: 2 },
    { prefix: 'Non-stick Pan',    cat: 'Kitchen',         priceRange: [800, 3500],     sup: 2 },
    { prefix: 'Sofa Set',         cat: 'Furniture',       priceRange: [20000, 80000],  sup: 2 },
    // Sports
    { prefix: 'Cricket Bat',      cat: 'Sports',          priceRange: [1500, 8000],    sup: 3 },
    { prefix: 'Dumbbell Set',     cat: 'Gym Equipment',   priceRange: [2000, 15000],   sup: 3 },
    // Books
    { prefix: 'Urdu Novel',       cat: 'Fiction',         priceRange: [300, 900],      sup: 4 },
    { prefix: 'Engineering Textbook', cat: 'Books',       priceRange: [800, 3000],     sup: 4 },
    // Beauty
    { prefix: 'Face Cream',       cat: 'Beauty',          priceRange: [400, 2500],     sup: 5 },
    { prefix: 'Hair Serum',       cat: 'Beauty',          priceRange: [600, 3000],     sup: 5 },
    // Groceries
    { prefix: 'Basmati Rice',     cat: 'Groceries',       priceRange: [200, 800],      sup: 6 },
    { prefix: 'Cooking Oil',      cat: 'Groceries',       priceRange: [300, 1200],     sup: 6 },
  ];

  const catMap = {};
  allCategories.forEach(c => (catMap[c.name] = c._id));

  const productDocs = [];
  const variants = ['Pro', 'Plus', 'Lite', 'Max', 'Ultra', 'Mini', 'Standard', 'Premium', 'Basic', 'Edition'];
  const colors   = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Grey'];

  for (let i = 0; i < 1050; i++) {
    const tpl = productTemplates[i % productTemplates.length];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const [minP, maxP] = tpl.priceRange;
    const price = Math.floor(Math.random() * (maxP - minP) + minP);
    const stock = Math.floor(Math.random() * 200);

    const catId = catMap[tpl.cat] || allCategories[i % allCategories.length]._id;
    const supId = suppliers[tpl.sup % suppliers.length]._id;

    productDocs.push({
      name: `${tpl.prefix} ${variant} ${color}`,
      description: `High quality ${tpl.prefix.toLowerCase()} in ${color}. ${variant} model with enhanced features.`,
      price,
      stockQuantity: stock,
      categoryId: catId,
      supplierId: supId
    });
  }

  const products = await Product.insertMany(productDocs);
  console.log(`Created ${products.length} products`);

  // ── Customers (520) ──────────────────────────────────────────────────────
  const customerDocs = [];
  for (let i = 0; i < 520; i++) {
    const city = CITIES[i % CITIES.length];
    customerDocs.push({
      name:         faker.person.fullName(),
      email:        `user${i + 1}@shopsphere.pk`,
      passwordHash: 'password123',
      phone:        `03${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
      addresses: [{
        street:    faker.location.streetAddress(),
        city,
        country:   'Pakistan',
        isDefault: true
      }]
    });
  }

  // bulk insert without bcrypt for speed (seed data)
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('password123', 10);
  const rawCustomers = customerDocs.map(c => ({ ...c, passwordHash: hash }));
  // bypass pre-save hook
  const customers = await Customer.collection.insertMany(rawCustomers);
  const customerIds = Object.values(customers.insertedIds);
  console.log(`Created ${customerIds.length} customers`);

  // ── Orders, OrderItems, Payments (5000+) ─────────────────────────────────
  const startDate = new Date('2024-01-01');
  const endDate   = new Date('2026-04-30');

  const orderBatch   = [];
  const itemBatch    = [];
  const paymentBatch = [];

  for (let i = 0; i < 5100; i++) {
    const customerId = customerIds[i % customerIds.length];
    const status     = weightedRandom(ORDER_STATUSES, STATUS_WEIGHTS);
    const orderDate  = randomDate(startDate, endDate);

    const numItems   = Math.floor(Math.random() * 4) + 1;
    const pickedProds = [];
    const usedIndexes = new Set();

    for (let j = 0; j < numItems; j++) {
      let idx;
      do { idx = Math.floor(Math.random() * products.length); } while (usedIndexes.has(idx));
      usedIndexes.add(idx);
      pickedProds.push(products[idx]);
    }

    const totalAmount = pickedProds.reduce((sum, p) => sum + p.price * 1, 0);
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];

    const orderId = new mongoose.Types.ObjectId();

    orderBatch.push({
      _id: orderId,
      customerId,
      orderDate,
      totalAmount,
      status,
      shippingAddress: { street: faker.location.streetAddress(), city, country: 'Pakistan' }
    });

    for (const prod of pickedProds) {
      itemBatch.push({
        orderId,
        productId: prod._id,
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: prod.price
      });
    }

    const method = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
    const payStatus = status === 'Delivered' ? 'Paid' : status === 'Cancelled' ? 'Refunded' : 'Pending';
    paymentBatch.push({
      orderId,
      method,
      amount: totalAmount,
      status: payStatus,
      paidAt: payStatus === 'Paid' ? orderDate : null
    });
  }

  // insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < orderBatch.length; i += chunkSize) {
    await Order.collection.insertMany(orderBatch.slice(i, i + chunkSize));
  }
  for (let i = 0; i < itemBatch.length; i += chunkSize) {
    await OrderItem.collection.insertMany(itemBatch.slice(i, i + chunkSize));
  }
  for (let i = 0; i < paymentBatch.length; i += chunkSize) {
    await Payment.collection.insertMany(paymentBatch.slice(i, i + chunkSize));
  }
  console.log(`Created ${orderBatch.length} orders, ${itemBatch.length} order items, ${paymentBatch.length} payments`);

  // ── Reviews (3000+) ──────────────────────────────────────────────────────
  const reviewDocs = [];
  const reviewed   = new Set();

  for (let i = 0; i < 3200; i++) {
    const custId = customerIds[i % customerIds.length].toString();
    const prod   = products[Math.floor(Math.random() * products.length)];
    const key    = `${custId}_${prod._id}`;
    if (reviewed.has(key)) continue;
    reviewed.add(key);

    reviewDocs.push({
      customerId: custId,
      productId:  prod._id,
      rating:     Math.floor(Math.random() * 3) + 3, // 3-5, mostly positive
      comment:    faker.helpers.arrayElement([
        'Great product, highly recommend!',
        'Good quality for the price.',
        'Arrived on time, exactly as described.',
        'Decent product, works as expected.',
        'Very satisfied with my purchase.',
        'Good value for money.',
        'Product is okay, nothing special.',
        'Excellent quality, will buy again.',
        'Fast delivery, good packaging.',
        'Happy with this purchase.',
      ])
    });
  }

  for (let i = 0; i < reviewDocs.length; i += chunkSize) {
    await Review.collection.insertMany(reviewDocs.slice(i, i + chunkSize));
  }
  console.log(`Created ${reviewDocs.length} reviews`);

  console.log('\nSeed complete!');
  console.log('Summary:');
  console.log(`  Categories: ${allCategories.length}`);
  console.log(`  Suppliers:  ${suppliers.length}`);
  console.log(`  Products:   ${products.length}`);
  console.log(`  Customers:  ${customerIds.length}`);
  console.log(`  Orders:     ${orderBatch.length}`);
  console.log(`  Payments:   ${paymentBatch.length}`);
  console.log(`  Reviews:    ${reviewDocs.length}`);
  console.log('\nTest login: user1@shopsphere.pk / password123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
