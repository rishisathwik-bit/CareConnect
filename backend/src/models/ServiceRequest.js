const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: 'CA' },
      zipCode: { type: String, required: true }
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium'
    },
    preferredDate: {
      type: Date,
      required: true
    },
    preferredSlot: {
      type: String,
      default: '09:00 - 12:00'
    },
    photos: [
      {
        type: String
      }
    ],
    budget: {
      type: Number,
      default: 100
    },
    aiClassification: {
      detectedCategoryName: String,
      suggestedSkills: [String],
      urgencyLevel: String,
      estimatedHours: Number,
      estimatedPriceRange: {
        min: Number,
        max: Number
      },
      confidenceScore: Number
    },
    status: {
      type: String,
      enum: ['open', 'quoted', 'booked', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'open'
    },
    assignedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    selectedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
