const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest'
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote'
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true // e.g. "09:00 - 12:00"
    },
    serviceAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: 'CA' },
      zipCode: { type: String, required: true }
    },
    status: {
      type: String,
      enum: ['scheduled', 'en_route', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'scheduled'
    },
    trackingEvents: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    evidence: {
      beforePhotos: [{ type: String }],
      afterPhotos: [{ type: String }],
      providerNotes: { type: String, default: '' },
      submittedAt: { type: Date }
    },
    customerConfirmed: {
      type: Boolean,
      default: false
    },
    customerConfirmedAt: {
      type: Date
    },
    pricing: {
      laborCost: { type: Number, default: 0 },
      partsCost: { type: Number, default: 0 },
      platformFee: { type: Number, default: 15 },
      tax: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        message: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index to ensure efficient lookup of provider schedules
bookingSchema.index({ provider: 1, scheduledDate: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
