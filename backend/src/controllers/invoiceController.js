const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { logAudit } = require('../services/auditService');

// @desc Get invoices by user role
// @route GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      filter.provider = req.user._id;
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    next(error);
  }
};

// @desc Get single invoice
// @route GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('provider', 'name email phone')
      .populate('booking');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc Simulate payment of an invoice
// @route POST /api/invoices/:id/pay
const payInvoice = async (req, res, next) => {
  try {
    const { paymentMethod = 'Credit Card (Simulated)' } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only customer can pay this invoice' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid' });
    }

    invoice.paymentStatus = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();
    invoice.transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    await invoice.save();

    await logAudit({
      action: 'INVOICE_PAID',
      performedBy: req.user._id,
      targetResource: 'Invoice',
      targetId: invoice._id,
      details: { totalAmount: invoice.totalAmount, transactionId: invoice.transactionId }
    });

    res.status(200).json({
      success: true,
      message: 'Payment simulated successfully! Receipt generated.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc Process refund (Support / Admin)
// @route POST /api/invoices/:id/refund
const refundInvoice = async (req, res, next) => {
  try {
    const { refundAmount, reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.paymentStatus = 'refunded';
    await invoice.save();

    await logAudit({
      action: 'INVOICE_REFUNDED',
      performedBy: req.user._id,
      targetResource: 'Invoice',
      targetId: invoice._id,
      details: { refundAmount: refundAmount || invoice.totalAmount, reason }
    });

    res.status(200).json({
      success: true,
      message: `Refund of $${refundAmount || invoice.totalAmount} processed successfully.`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  payInvoice,
  refundInvoice
};
