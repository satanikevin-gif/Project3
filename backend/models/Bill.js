const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name:       { type: String, required: true },
  batchNo:    { type: String, default: '' },
  expiryDate: { type: Date },
  qty:        { type: Number, required: true, min: 1 },
  mrp:        { type: Number, required: true },
  gstSlab:    { type: Number, default: 12 },
  gstAmount:  { type: Number, default: 0 },
  lineTotal:  { type: Number, required: true }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNo:       { type: String, unique: true, required: true },
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, required: true },
  customerPhone:{ type: String, default: '' },
  items:        [billItemSchema],
  subtotal:     { type: Number, required: true },
  gstBreakup: {
    slab0:  { type: Number, default: 0 },
    slab5:  { type: Number, default: 0 },
    slab12: { type: Number, default: 0 },
    slab18: { type: Number, default: 0 }
  },
  gstTotal:     { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  grandTotal:   { type: Number, required: true },
  paymentMode:  { type: String, enum: ['cash', 'upi', 'card', 'credit'], default: 'cash' },
  invoicePdfUrl:{ type: String, default: '' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
