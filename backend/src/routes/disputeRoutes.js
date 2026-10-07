const express = require('express');
const router = express.Router();
const {
  createDispute,
  getDisputes,
  getDisputeById,
  addDisputeMessage,
  resolveDispute
} = require('../controllers/disputeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, createDispute);
router.get('/', protect, getDisputes);
router.get('/:id', protect, getDisputeById);
router.post('/:id/messages', protect, addDisputeMessage);
router.put('/:id/resolve', protect, authorize('support', 'admin'), resolveDispute);

module.exports = router;
