const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/categories
exports.getAll = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parentCategoryId', 'name')
    .sort({ name: 1 });

  // attach product count to each category
  const withCounts = await Promise.all(categories.map(async (cat) => {
    const count = await Product.countDocuments({ categoryId: cat._id });
    return { ...cat.toObject(), productCount: count };
  }));

  res.json({ success: true, count: categories.length, data: withCounts });
});

// GET /api/categories/:id
exports.getOne = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('parentCategoryId', 'name');
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

  const products = await Product.find({ categoryId: category._id })
    .populate('supplierId', 'name')
    .limit(20);

  res.json({ success: true, data: { category, products } });
});

// GET /api/categories/tree  — hierarchical view
exports.getTree = asyncHandler(async (req, res) => {
  const parents = await Category.find({ parentCategoryId: null }).sort({ name: 1 });
  const tree = await Promise.all(parents.map(async (parent) => {
    const subcategories = await Category.find({ parentCategoryId: parent._id });
    const parentCount = await Product.countDocuments({ categoryId: parent._id });
    return {
      ...parent.toObject(),
      productCount: parentCount,
      subcategories: await Promise.all(subcategories.map(async (sub) => ({
        ...sub.toObject(),
        productCount: await Product.countDocuments({ categoryId: sub._id })
      })))
    };
  }));

  res.json({ success: true, data: tree });
});

// POST /api/categories
exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

// PUT /api/categories/:id
exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
});

// DELETE /api/categories/:id
exports.remove = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ categoryId: req.params.id });
  if (productCount > 0)
    return res.status(400).json({ success: false, message: `Cannot delete: ${productCount} products use this category` });

  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});
