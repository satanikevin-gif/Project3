const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name:            { type: String, required: [true, 'Medicine name is required'], trim: true },
  genericName:     { type: String, default: '', trim: true },
  brand:           { type: String, default: '', trim: true },
  manufacturer:    { type: String, default: '', trim: true },
  category:        { type: String, enum: ['tablets', 'syrup', 'injection', 'topical', 'drops', 'inhaler', 'other'], default: 'other' },
  batchNo:         { type: String, required: true, trim: true },
  mfgDate:         { type: Date, required: true },
  expiryDate:      { type: Date, required: true, index: true },
  unit:            { type: String, enum: ['tablet', 'capsule', 'ml', 'mg', 'g', 'strip', 'bottle', 'tube'], default: 'strip' },
  packSize:        { type: Number, default: 1 },
  mrp:             { type: Number, required: true, min: 0 },
  purchasePrice:   { type: Number, required: true, min: 0 },
  stock:           { type: Number, required: true, min: 0, default: 0, index: true },
  reorderThreshold:{ type: Number, default: 10 },
  rackLocation:    { type: String, default: '' },
  gstSlab:         { type: Number, enum: [0, 5, 12, 18], default: 12 },
  barcodeId:       { type: String, unique: true, sparse: true, trim: true },
  isActive:        { type: Boolean, default: true },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
