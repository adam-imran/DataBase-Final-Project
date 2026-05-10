require('dotenv').config();
const mongoose = require('mongoose');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopsphere';

function printHeader(title, sql) {
  console.log('\n' + '='.repeat(70));
  console.log(`QUERY: ${title}`);
  console.log(`SQL equivalent: ${sql}`);
  console.log('='.repeat(70));
}

function printTable(rows, columns) {
  if (!rows.length) { console.log('  (no results)'); return; }
  const widths = columns.map(col => Math.max(col.length, ...rows.map(r => String(r[col] ?? '').length)));
  const line = widths.map(w => '-'.repeat(w + 2)).join('+');
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  console.log('  ' + header);
  console.log('  ' + line);
  rows.forEach(row => {
    const rowStr = columns.map((col, i) => String(row[col] ?? '').padEnd(widths[i])).join(' | ');
    console.log('  ' + rowStr);
  });
  console.log(`\n  Total rows: ${rows.length}`);
}

async function query1() {
  printHeader(
    'Monthly Revenue by Category',
    'SELECT CategoryName, MONTH(OrderDate), YEAR(OrderDate), SUM(Qty*Price) AS Revenue FROM OrderItems JOIN Orders JOIN Products JOIN Categories WHERE Status=Delivered GROUP BY Category, Year, Month ORDER BY Revenue DESC'
  );

  const result = await OrderItem.aggregate([
    { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
    { $unwind: '$order' },
    { $match: { 'order.status': 'Delivered' } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $group: {
        _id: { category: '$category.name', month: { $month: '$order.orderDate' }, year: { $year: '$order.orderDate' } },
        revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        month: '$_id.month',
        year: '$_id.year',
        revenue: { $round: ['$revenue', 0] }
      }
    }
  ]);

  printTable(result, ['category', 'year', 'month', 'revenue']);
}

async function query2() {
  printHeader(
    'Top 5 Best-Selling Products',
    'SELECT p.Name, SUM(oi.Quantity) AS TotalSold, SUM(oi.Quantity*oi.UnitPrice) AS Revenue FROM OrderItems oi JOIN Products p GROUP BY p.ProductID ORDER BY TotalSold DESC LIMIT 5'
  );

  const result = await OrderItem.aggregate([
    { $group: { _id: '$productId', totalSold: { $sum: '$quantity' }, totalRevenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productName: '$product.name',
        category: '$category.name',
        price: '$product.price',
        currentStock: '$product.stockQuantity',
        totalSold: 1,
        totalRevenue: { $round: ['$totalRevenue', 0] }
      }
    }
  ]);

  printTable(result, ['productName', 'category', 'totalSold', 'totalRevenue', 'currentStock']);
}

async function query3() {
  printHeader(
    'Customers with Total Spend Above Average',
    'SELECT c.Name, c.Email, COUNT(o.OrderID) AS Orders, SUM(o.TotalAmount) AS TotalSpend FROM Orders o JOIN Customers c WHERE Status != Cancelled GROUP BY c.CustomerID HAVING TotalSpend > (SELECT AVG(TotalAmount) FROM Orders) ORDER BY TotalSpend DESC'
  );

  const avgResult = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
  ]);
  const avgSpend = Math.round(avgResult[0]?.avg || 0);
  console.log(`\n  Average order spend: PKR ${avgSpend.toLocaleString()}`);

  const result = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$customerId', totalSpend: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
    { $match: { totalSpend: { $gt: avgSpend } } },
    { $sort: { totalSpend: -1 } },
    { $limit: 15 },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 0,
        name: '$customer.name',
        email: '$customer.email',
        city: '$customer.city',
        orderCount: 1,
        totalSpend: { $round: ['$totalSpend', 0] }
      }
    }
  ]);

  printTable(result, ['name', 'city', 'orderCount', 'totalSpend']);
}

async function query4() {
  printHeader(
    'Low Stock Alert (Stock < 10)',
    'SELECT p.Name, p.StockQuantity, p.Price, c.Name AS Category, s.Name AS Supplier, s.ContactEmail FROM Products p JOIN Categories c JOIN Suppliers s WHERE p.StockQuantity < 10 ORDER BY StockQuantity ASC'
  );

  const result = await Product.aggregate([
    { $match: { stockQuantity: { $lt: 10 }, isDeleted: false } },
    { $sort: { stockQuantity: 1 } },
    { $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
    { $unwind: '$supplier' },
    { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        productName: '$name',
        stockQuantity: 1,
        price: 1,
        category: '$category.name',
        supplierName: '$supplier.name',
        supplierEmail: '$supplier.contactEmail'
      }
    }
  ]);

  printTable(result, ['productName', 'stockQuantity', 'price', 'category', 'supplierName']);
}

async function query5() {
  printHeader(
    'Order History with Payment Status (Latest 15)',
    'SELECT c.Name, o.OrderDate, o.TotalAmount, o.Status, p.Method, p.Status AS PaymentStatus FROM Orders o JOIN Customers c JOIN Payments p ORDER BY o.OrderDate DESC LIMIT 15'
  );

  const result = await Order.aggregate([
    { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    { $lookup: { from: 'payments', localField: '_id', foreignField: 'orderId', as: 'payment' } },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    { $sort: { orderDate: -1 } },
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        customerName: '$customer.name',
        orderDate: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
        totalAmount: 1,
        orderStatus: '$status',
        paymentMethod: '$payment.method',
        paymentStatus: '$payment.status'
      }
    }
  ]);

  printTable(result, ['customerName', 'orderDate', 'totalAmount', 'orderStatus', 'paymentMethod', 'paymentStatus']);
}

async function query6() {
  printHeader(
    'Top Rated Products (minimum 5 reviews)',
    'SELECT p.Name, c.Name AS Category, COUNT(r.ReviewID) AS Reviews, AVG(r.Rating) AS AvgRating FROM Reviews r JOIN Products p JOIN Categories c GROUP BY p.ProductID HAVING COUNT(r.ReviewID) >= 5 ORDER BY AvgRating DESC LIMIT 10'
  );

  const result = await Review.aggregate([
    { $group: { _id: '$productId', reviewCount: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    { $match: { reviewCount: { $gte: 5 } } },
    { $sort: { avgRating: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productName: '$product.name',
        category: '$category.name',
        price: '$product.price',
        reviewCount: 1,
        avgRating: { $round: ['$avgRating', 2] }
      }
    }
  ]);

  printTable(result, ['productName', 'category', 'price', 'reviewCount', 'avgRating']);
}

async function main() {
  console.log('\nShopSphere - Required Query Report');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  await query1();
  await query2();
  await query3();
  await query4();
  await query5();
  await query6();

  console.log('\n' + '='.repeat(70));
  console.log('All 6 queries completed.');
  console.log('='.repeat(70) + '\n');

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
