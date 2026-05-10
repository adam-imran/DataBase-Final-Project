const mongoose = require('mongoose');

// Trigger equivalent — auto-logged on every stock change
const inventoryLogSchema = new mongoose.Schema({
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  changeType: { type: String, enum: ['decrement', 'increment', 'adjustment'], required: true },
  quantity:   { type: Number, required: true },
  reason:     { type: String, default: '' },
  orderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  stockAfter: { type: Number, required: true }
}, { timestamps: true });

inventoryLogSchema.index({ productId: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
