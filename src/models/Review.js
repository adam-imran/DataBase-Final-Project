const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, default: '' },
}, { timestamps: true });

// one review per customer per product
reviewSchema.index({ customerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
