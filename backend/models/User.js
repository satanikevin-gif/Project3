const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Name is required'], trim: true },
  email:       { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: [true, 'Phone is required'], trim: true },
  password:    { type: String, required: [true, 'Password is required'], minlength: 6 },
  role:        { type: String, enum: ['admin', 'supplier', 'customer'], default: 'customer' },
  address: {
    street:    { type: String, default: '' },
    city:      { type: String, default: '' },
    state:     { type: String, default: '' },
    pincode:   { type: String, default: '' }
  },
  loyaltyPoints:   { type: Number, default: 0 },
  isActive:        { type: Boolean, default: true },
  resetOTP:        { type: String, default: null },
  resetOTPExpiry:  { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOTP;
  delete obj.resetOTPExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
