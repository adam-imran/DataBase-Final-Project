const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:             { type: String, required: true, unique: true, trim: true },
  parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  description:      { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
