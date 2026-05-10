const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  method:  { type: String, enum: ['Credit Card', 'COD', 'Bank Transfer', 'JazzCash', 'EasyPaisa'], required: true },
  amount:  { type: Number, required: true, min: 0 },
  paidAt:  { type: Date, default: null },
  status:  { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
