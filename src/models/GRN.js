const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  medicineId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  orderedQty:   { type: Number, default: 0 },
  receivedQty:  { type: Number, required: true, min: 0 }
}, { _id: false });

const grnSchema = new mongoose.Schema({
  poId:        { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  supplierId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items:       [grnItemSchema],
  notes:       { type: String, default: '' },
  receivedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('GRN', grnSchema);
