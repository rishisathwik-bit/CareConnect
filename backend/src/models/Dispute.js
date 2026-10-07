const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['poor_quality', 'late_arrival', 'unfinished_work', 'overcharge', 'property_damage', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    evidence: [
      {
        type: String
      }
    ],
    desiredOutcome: {
      type: String,
      enum: ['full_refund', 'partial_refund', 'rework', 'apology'],
      default: 'partial_refund'
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open'
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: {
      decision: {
        type: String,
        enum: ['full_refund', 'partial_refund', 'rejected', 'rework_completed']
      },
      refundAmount: {
        type: Number,
        default: 0
      },
      notes: {
        type: String,
        default: ''
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolvedAt: {
        type: Date
      }
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
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

module.exports = mongoose.model('Dispute', disputeSchema);
