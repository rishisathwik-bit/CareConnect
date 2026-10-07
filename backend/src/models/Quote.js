const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Quote amount is required'],
      min: [1, 'Quote amount must be positive']
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours is required'],
      default: 2
    },
    message: {
      type: String,
      default: ''
    },
    breakdown: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    validUntil: {
      type: Date,
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quote', quoteSchema);
