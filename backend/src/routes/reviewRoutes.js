const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewsForProvider,
  replyToReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, authorize('customer'), createReview);
router.get('/provider/:providerId', getReviewsForProvider);
router.put('/:id/reply', protect, authorize('provider'), replyToReview);

module.exports = router;
