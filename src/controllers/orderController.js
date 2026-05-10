const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_TRANSITIONS = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped:   ['Delivered'],
  Delivered: [],
  Cancelled: []
};

// GET /api/orders
exports.getAll = asyncHandler(async (req, res) => {
  const { customerId, status } = req.query;
  const filter = {};
  if (customerId) filter.customerId = customerId;
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate('customerId', 'name email')
    .sort({ orderDate: -1 });
  res.json({ success: true, count: orders.length, data: orders });
});

// GET /api/orders/:id  — full invoice
exports.getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customerId', 'name email phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const items = await OrderItem.find({ orderId: order._id }).populate('productId', 'name imageUrl');
  const payment = await Payment.findOne({ orderId: order._id });

  res.json({ success: true, data: { order, items, payment } });
});

// POST /api/orders  — ACID transaction: create order + items + payment + decrement stock
exports.create = asyncHandler(async (req, res) => {
  const { customerId, items, paymentMethod, shippingAddress, notes } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ success: false, message: 'Order must have at least one item' });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stockQuantity < item.quantity)
        throw new Error(`Insufficient stock for "${product.name}"`);

      totalAmount += product.price * item.quantity;
      resolvedItems.push({ product, quantity: item.quantity, unitPrice: product.price });
    }

    const [order] = await Order.create([{ customerId, totalAmount, shippingAddress, notes }], { session });

    const orderItemDocs = resolvedItems.map(({ product, quantity, unitPrice }) => ({
      orderId: order._id, productId: product._id, quantity, unitPrice
    }));
    await OrderItem.insertMany(orderItemDocs, { session });

    // decrement stock + log (trigger equivalent)
    for (const { product, quantity } of resolvedItems) {
      product.stockQuantity -= quantity;
      await product.save({ session });
      await InventoryLog.create([{
        productId: product._id,
        changeType: 'decrement',
        quantity,
        reason: `Order ${order._id}`,
        orderId: order._id,
        stockAfter: product.stockQuantity
      }], { session });
    }

    await Payment.create([{
      orderId: order._id,
      method: paymentMethod || 'COD',
      amount: totalAmount
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Order placed successfully', data: { orderId: order._id, totalAmount } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status  — lifecycle transition
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (!VALID_TRANSITIONS[order.status].includes(status))
    return res.status(400).json({ success: false, message: `Cannot move from ${order.status} to ${status}` });

  order.status = status;
  await order.save();

  // mark payment as paid on delivery
  if (status === 'Delivered') {
    await Payment.findOneAndUpdate(
      { orderId: order._id, status: 'Pending' },
      { status: 'Paid', paidAt: new Date() }
    );
  }

  // restore stock on cancellation
  if (status === 'Cancelled') {
    const items = await OrderItem.find({ orderId: order._id });
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
        await InventoryLog.create({
          productId: product._id, changeType: 'increment',
          quantity: item.quantity, reason: `Cancelled order ${order._id}`,
          orderId: order._id, stockAfter: product.stockQuantity
        });
      }
    }
  }

  res.json({ success: true, data: order });
});
