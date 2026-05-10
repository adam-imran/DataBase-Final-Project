const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  country:   { type: String, default: 'Pakistan' },
  isDefault: { type: Boolean, default: false }
});

const customerSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone:        { type: String, default: '' },
  addresses:    [addressSchema],
  isDeleted:    { type: Boolean, default: false }
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

customerSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.passwordHash);
};

// exclude soft-deleted by default
customerSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
