const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema({
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderDate:       { type: Date, default: Date.now },
  totalAmount:     { type: Number, required: true, min: 0 },
  status:          { type: String, enum: ORDER_STATUSES, default: 'Pending' },
  shippingAddress: {
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    country: { type: String, default: 'Pakistan' }
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema);
