const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  supplierId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  imageUrl:      { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false }
}, { timestamps: true });

// index for search and low-stock queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ stockQuantity: 1 });
productSchema.index({ categoryId: 1 });

productSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Product', productSchema);
