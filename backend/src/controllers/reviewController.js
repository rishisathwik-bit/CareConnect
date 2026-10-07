const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { logAudit } = require('../services/auditService');

// @desc Create review for completed booking
// @route POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, punctualityRating, qualityRating, cleanlinessRating } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only customer of this booking can review' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed bookings' });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this booking' });
    }

    const review = await Review.create({
      booking: bookingId,
      customer: req.user._id,
      provider: booking.provider,
      rating,
      comment,
      punctualityRating: punctualityRating || 5,
      qualityRating: qualityRating || 5,
      cleanlinessRating: cleanlinessRating || 5
    });

    await logAudit({
      action: 'REVIEW_SUBMITTED',
      performedBy: req.user._id,
      targetResource: 'Review',
      targetId: review._id,
      details: { rating, provider: booking.provider }
    });

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    next(error);
  }
};

// @desc Get reviews for a provider
// @route GET /api/reviews/provider/:providerId
const getReviewsForProvider = async (req, res, next) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc Provider replies to review
// @route PUT /api/reviews/:id/reply
const replyToReview = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only review recipient can reply' });
    }

    review.providerReply = reply;
    review.providerRepliedAt = new Date();
    await review.save();

    res.status(200).json({ success: true, message: 'Reply posted', data: review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewsForProvider,
  replyToReview
};
