const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ productId: 1 });

// virtual: line total
orderItemSchema.virtual('lineTotal').get(function () {
  return this.quantity * this.unitPrice;
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
