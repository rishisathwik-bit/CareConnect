const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    punctualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    cleanlinessRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    providerReply: {
      type: String,
      default: ''
    },
    providerRepliedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// After saving review, recalculate provider ratingAverage and ratingCount
reviewSchema.post('save', async function () {
  try {
    const ProviderProfile = mongoose.model('ProviderProfile');
    const stats = await mongoose.model('Review').aggregate([
      { $match: { provider: this.provider } },
      {
        $group: {
          _id: '$provider',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await ProviderProfile.findOneAndUpdate(
        { user: this.provider },
        {
          ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
          ratingCount: stats[0].count
        }
      );
    }
  } catch (err) {
    console.error('Error updating provider rating aggregate:', err);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
