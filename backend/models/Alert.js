const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  medicineId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName:   { type: String, required: true },
  type:           { type: String, enum: ['low_stock', 'expiry'], required: true },
  severity:       { type: String, enum: ['critical', 'warning', 'info'], required: true },
  message:        { type: String, required: true },
  isAcknowledged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
