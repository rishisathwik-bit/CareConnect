const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      default: ''
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory'
      }
    ],
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    hourlyRate: {
      type: Number,
      default: 50,
      min: [15, 'Hourly rate must be at least $15']
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0
    },
    serviceAreas: [
      {
        type: String,
        trim: true
      }
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending'
    },
    verificationNotes: {
      type: String,
      default: ''
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    documents: [
      {
        docType: {
          type: String,
          enum: ['license', 'insurance', 'id_proof', 'certification'],
          default: 'license'
        },
        title: { type: String, default: 'Document' },
        fileUrl: { type: String, required: true },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    ratingAverage: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    completedJobsCount: {
      type: Number,
      default: 0
    },
    availability: {
      workingDays: {
        type: [String],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      slots: {
        type: [
          {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '12:00' }
          }
        ],
        default: [
          { start: '09:00', end: '12:00' },
          { start: '13:00', end: '16:00' },
          { start: '16:00', end: '19:00' }
        ]
      },
      blackoutDates: [Date]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
