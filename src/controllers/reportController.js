const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { asyncHandler } = require('../middleware/errorHandler');

// Query 1: Monthly Revenue by Category
// SQL equivalent: SELECT CategoryName, MONTH(OrderDate), SUM(qty*price) GROUP BY category, month
exports.monthlyRevenueByCategory = asyncHandler(async (req, res) => {
  const result = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order'
      }
    },
    { $unwind: '$order' },
    { $match: { 'order.status': 'Delivered' } },
    {
      $lookup: {
        from: 'products', localField: 'productId', foreignField: '_id', as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: {
          category: '$category.name',
          month: { $month: '$order.orderDate' },
          year:  { $year:  '$order.orderDate' }
        },
        revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        month: '$_id.month',
        year:  '$_id.year',
        revenue: { $round: ['$revenue', 2] }
      }
    }
  ]);

  res.json({ success: true, query: 'Monthly Revenue by Category', count: result.length, data: result });
});

// Query 2: Top 5 Best-Selling Products
// SQL equivalent: SELECT p.Name, SUM(qty) ORDER BY TotalSold DESC LIMIT 5
exports.topProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const result = await OrderItem.aggregate([
    {
      $group: {
        _id: '$productId',
        totalSold: { $sum: '$quantity' },
        totalRevenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products', localField: '_id', foreignField: '_id', as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productName: '$product.name',
        category: '$category.name',
        price: '$product.price',
        currentStock: '$product.stockQuantity',
        totalSold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] }
      }
    }
  ]);

  res.json({ success: true, query: 'Top Best-Selling Products', count: result.length, data: result });
});

// Query 3: Customers with Orders Above Average Spend
// SQL equivalent: HAVING TotalSpend > (SELECT AVG(TotalAmount) FROM Orders)
exports.highSpenders = asyncHandler(async (req, res) => {
  const avgResult = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
  ]);
  const avgSpend = avgResult[0]?.avg || 0;

  const result = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$customerId',
        totalSpend: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $match: { totalSpend: { $gt: avgSpend } } },
    { $sort: { totalSpend: -1 } },
    {
      $lookup: {
        from: 'customers', localField: '_id', foreignField: '_id', as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 0,
        name: '$customer.name',
        email: '$customer.email',
        orderCount: 1,
        totalSpend: { $round: ['$totalSpend', 2] }
      }
    }
  ]);

  res.json({
    success: true,
    query: 'Customers Above Average Spend',
    averageSpend: Math.round(avgSpend),
    count: result.length,
    data: result
  });
});

// Query 4: Low Stock Alert
// SQL equivalent: WHERE StockQuantity < 10 JOIN Suppliers
exports.lowStockAlert = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const result = await Product.aggregate([
    { $match: { stockQuantity: { $lt: threshold }, isDeleted: false } },
    { $sort: { stockQuantity: 1 } },
    {
      $lookup: {
        from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier'
      }
    },
    { $unwind: '$supplier' },
    {
      $lookup: {
        from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        productName: '$name',
        stockQuantity: 1,
        price: 1,
        category: '$category.name',
        supplierName: '$supplier.name',
        supplierEmail: '$supplier.contactEmail',
        supplierPhone: '$supplier.phone'
      }
    }
  ]);

  res.json({ success: true, query: 'Low Stock Alert', threshold, count: result.length, data: result });
});

// Query 5: Customer Order History with Payment Status
// SQL equivalent: JOIN Customers, Orders, Payments ORDER BY OrderDate DESC
exports.orderHistory = asyncHandler(async (req, res) => {
  const { customerId, status } = req.query;
  const matchStage = customerId ? { 'customer._id': new mongoose.Types.ObjectId(customerId) } : {};
  if (status) matchStage.status = status;

  const result = await Order.aggregate([
    {
      $lookup: {
        from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $lookup: {
        from: 'payments', localField: '_id', foreignField: 'orderId', as: 'payment'
      }
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    { $match: matchStage },
    { $sort: { orderDate: -1 } },
    { $limit: 100 },
    {
      $project: {
        _id: 0,
        orderId: '$_id',
        customerName: '$customer.name',
        email: '$customer.email',
        orderDate: 1,
        totalAmount: 1,
        orderStatus: '$status',
        paymentMethod: '$payment.method',
        paymentStatus: '$payment.status'
      }
    }
  ]);

  res.json({ success: true, query: 'Order History with Payment Status', count: result.length, data: result });
});

// Query 6: Top Rated Products (min 5 reviews)
// SQL equivalent: HAVING COUNT(ReviewID) >= 5 ORDER BY AvgRating DESC
exports.topRatedProducts = asyncHandler(async (req, res) => {
  const minReviews = parseInt(req.query.minReviews) || 5;
  const result = await Review.aggregate([
    {
      $group: {
        _id: '$productId',
        reviewCount: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    },
    { $match: { reviewCount: { $gte: minReviews } } },
    { $sort: { avgRating: -1 } },
    {
      $lookup: {
        from: 'products', localField: '_id', foreignField: '_id', as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category'
      }
    },
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

  res.json({ success: true, query: 'Top Rated Products', minReviews, count: result.length, data: result });
});

// Bonus: Dashboard summary
exports.dashboard = asyncHandler(async (req, res) => {
  const [orders, customers, products, revenue] = await Promise.all([
    Order.countDocuments(),
    Customer.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  const statusBreakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      totalOrders: orders,
      totalCustomers: customers,
      totalProducts: products,
      totalRevenue: revenue[0]?.total || 0,
      ordersByStatus: statusBreakdown
    }
  });
});
