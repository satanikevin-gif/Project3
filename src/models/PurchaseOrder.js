const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  medicineId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName:  { type: String, required: true },
  quantity:      { type: Number, required: true, min: 1 },
  expectedPrice: { type: Number, default: 0 }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber:       { type: String, unique: true, required: true },
  supplierId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName:   { type: String, required: true },
  items:          [poItemSchema],
  status:         { type: String, enum: ['pending', 'accepted', 'rejected', 'dispatched', 'received'], default: 'pending' },
  expectedDelivery:{ type: Date },
  notes:          { type: String, default: '' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
