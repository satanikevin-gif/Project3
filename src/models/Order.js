const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name:       { type: String, required: true },
  qty:        { type: Number, required: true, min: 1 },
  mrp:        { type: Number, required: true },
  lineTotal:  { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNo:            { type: String, unique: true, required: true },
  customerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:              [orderItemSchema],
  prescriptionUrl:    { type: String, default: '' },
  totalAmount:        { type: Number, required: true },
  loyaltyPointsUsed:  { type: Number, default: 0 },
  loyaltyPointsEarned:{ type: Number, default: 0 },
  deliveryAddress: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  status:             { type: String, enum: ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus:      { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId:    { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
