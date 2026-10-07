const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  cancelRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, authorize('customer'), createRequest);
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/cancel', protect, cancelRequest);

module.exports = router;
