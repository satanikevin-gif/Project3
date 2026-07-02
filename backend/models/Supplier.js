const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Supplier name is required'], trim: true },
  company:     { type: String, default: '', trim: true },
  email:       { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: [true, 'Phone is required'], trim: true },
  address: {
    street:    { type: String, default: '' },
    city:      { type: String, default: '' },
    state:     { type: String, default: '' },
    pincode:   { type: String, default: '' }
  },
  gstNumber:   { type: String, default: '' },
  categories:  [{ type: String, enum: ['tablets', 'syrup', 'injection', 'topical', 'drops', 'inhaler', 'other'] }],
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
