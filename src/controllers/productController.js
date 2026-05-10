const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products
exports.getAll = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, lowStock } = req.query;
  const filter = {};

  if (search) filter.$text = { $search: search };
  if (category) filter.categoryId = category;
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);
  if (lowStock === 'true') filter.stockQuantity = { $lt: 10 };

  const products = await Product.find(filter)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name contactEmail')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: products.length, data: products });
});

// GET /api/products/low-stock  (Query 4 equivalent)
exports.getLowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({ stockQuantity: { $lt: 10 } })
    .populate('supplierId', 'name contactEmail phone')
    .sort({ stockQuantity: 1 });
  res.json({ success: true, count: products.length, data: products });
});

// GET /api/products/:id
exports.getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name contactEmail');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

// POST /api/products
exports.create = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  await product.populate('categoryId supplierId');
  res.status(201).json({ success: true, data: product });
});

// PUT /api/products/:id
exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

// POST /api/products/:id/stock  — manual stock adjustment
exports.adjustStock = asyncHandler(async (req, res) => {
  const { quantity, reason } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.stockQuantity += quantity;
  if (product.stockQuantity < 0) return res.status(400).json({ success: false, message: 'Insufficient stock' });
  await product.save();

  await InventoryLog.create({
    productId: product._id,
    changeType: quantity >= 0 ? 'increment' : 'decrement',
    quantity: Math.abs(quantity),
    reason: reason || 'Manual adjustment',
    stockAfter: product.stockQuantity
  });

  res.json({ success: true, data: { stockQuantity: product.stockQuantity } });
});

// DELETE /api/products/:id  (soft delete)
exports.remove = asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ success: true, message: 'Product removed from catalog' });
});
