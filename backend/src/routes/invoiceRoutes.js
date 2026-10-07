const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  payInvoice,
  refundInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/:id/pay', protect, payInvoice);
router.post('/:id/refund', protect, authorize('support', 'admin'), refundInvoice);

module.exports = router;
