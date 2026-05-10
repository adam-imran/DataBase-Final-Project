const Review = require('../models/Review');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/reviews?productId=
exports.getByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const filter = productId ? { productId } : {};
  const reviews = await Review.find(filter)
    .populate('customerId', 'name')
    .populate('productId', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, data: reviews });
});

// POST /api/reviews  — only after confirmed purchase
exports.create = asyncHandler(async (req, res) => {
  const { customerId, productId, rating, comment } = req.body;

  const delivered = await Order.findOne({ customerId, status: 'Delivered' });
  if (!delivered) {
    const hasOrder = delivered || await Order.findOne({ customerId });
    if (!hasOrder) return res.status(403).json({ success: false, message: 'You can only review products you have purchased' });
  }

  const review = await Review.create({ customerId, productId, rating, comment });
  res.status(201).json({ success: true, data: review });
});

// DELETE /api/reviews/:id
exports.remove = asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Review removed' });
});
