const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Standard Platform Pricing'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      default: null // null means platform-wide default
    },
    platformFeePercentage: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
      max: 50
    },
    urgencySurgeMultiplier: {
      low: { type: Number, default: 1.0 },
      medium: { type: Number, default: 1.0 },
      high: { type: Number, default: 1.25 },
      emergency: { type: Number, default: 1.5 }
    },
    taxPercentage: {
      type: Number,
      default: 8.25,
      min: 0
    },
    minimumBookingFee: {
      type: Number,
      default: 35,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
