const express = require('express');
const router = express.Router();
const {
  createQuote,
  getQuotesForRequest,
  acceptQuote
} = require('../controllers/quoteController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, authorize('provider'), createQuote);
router.get('/request/:requestId', protect, getQuotesForRequest);
router.put('/:id/accept', protect, acceptQuote);

module.exports = router;
