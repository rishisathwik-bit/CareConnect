const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  directBook,
  updateBookingStatus,
  uploadEvidence,
  confirmCompletion,
  assignProvider,
  dispatchRequest,
  addBookingMessage,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingById);
router.post('/direct', protect, authorize('customer'), directBook);
router.post('/dispatch', protect, authorize('operations', 'admin'), dispatchRequest);
router.post('/:id/messages', protect, addBookingMessage);
router.put('/:id/status', protect, authorize('provider', 'operations', 'admin'), updateBookingStatus);
router.post('/:id/evidence', protect, authorize('provider', 'operations', 'admin'), uploadEvidence);
router.put('/:id/confirm', protect, authorize('customer'), confirmCompletion);
router.put('/:id/assign', protect, authorize('operations', 'admin'), assignProvider);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
