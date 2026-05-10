const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/suppliers
exports.getAll = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { contactEmail: new RegExp(search, 'i') }] }
    : {};

  const suppliers = await Supplier.find(filter).sort({ name: 1 });

  const withCounts = await Promise.all(suppliers.map(async (sup) => {
    const count = await Product.countDocuments({ supplierId: sup._id });
    return { ...sup.toObject(), productCount: count };
  }));

  res.json({ success: true, count: suppliers.length, data: withCounts });
});

// GET /api/suppliers/:id
exports.getOne = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

  const products = await Product.find({ supplierId: supplier._id })
    .populate('categoryId', 'name')
    .select('name price stockQuantity')
    .limit(50);

  res.json({ success: true, data: { supplier, products } });
});

// POST /api/suppliers
exports.create = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

// PUT /api/suppliers/:id
exports.update = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
});

// DELETE /api/suppliers/:id
exports.remove = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ supplierId: req.params.id });
  if (productCount > 0)
    return res.status(400).json({ success: false, message: `Cannot delete: ${productCount} products linked to this supplier` });

  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Supplier deleted' });
});
