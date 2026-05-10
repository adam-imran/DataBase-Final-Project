const Customer = require('../models/Customer');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/customers
exports.getAll = asyncHandler(async (req, res) => {
  const { search, city } = req.query;
  const filter = {};
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') }
  ];
  if (city) filter['addresses.city'] = new RegExp(city, 'i');

  const customers = await Customer.find(filter).select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, count: customers.length, data: customers });
});

// GET /api/customers/:id
exports.getOne = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).select('-passwordHash');
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: customer });
});

// POST /api/customers/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const customer = await Customer.create({
    name, email, passwordHash: password, phone,
    addresses: address ? [{ ...address, isDefault: true }] : []
  });
  res.status(201).json({ success: true, message: 'Customer registered', data: { _id: customer._id, name: customer.name, email: customer.email } });
});

// POST /api/customers/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const customer = await Customer.findOne({ email }).select('+passwordHash');
  if (!customer || !(await customer.matchPassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, message: 'Login successful', data: { _id: customer._id, name: customer.name, email: customer.email } });
});

// PUT /api/customers/:id
exports.update = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const customer = await Customer.findByIdAndUpdate(req.params.id, { name, phone }, { new: true, runValidators: true }).select('-passwordHash');
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: customer });
});

// POST /api/customers/:id/addresses
exports.addAddress = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  if (req.body.isDefault) customer.addresses.forEach(a => (a.isDefault = false));
  customer.addresses.push(req.body);
  await customer.save();
  res.json({ success: true, data: customer.addresses });
});

// DELETE /api/customers/:id  (soft delete)
exports.remove = asyncHandler(async (req, res) => {
  await Customer.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ success: true, message: 'Customer deactivated' });
});
