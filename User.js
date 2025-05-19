const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.walletAddress; // Password required only for email users
    }
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true // Allows null values without violating unique constraint
  },
  walletType: {
    type: String,
    enum: ['metamask', 'trustwallet', 'binance', null],
    default: null
  },
  country: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  tradingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);