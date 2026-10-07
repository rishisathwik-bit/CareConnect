const Dispute = require('../models/Dispute');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { logAudit } = require('../services/auditService');

// @desc Create new dispute
// @route POST /api/disputes
const createDispute = async (req, res, next) => {
  try {
    const { bookingId, reason, description, desiredOutcome, evidence } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Only booking participants can raise a dispute' });
    }

    const against = isCustomer ? booking.provider : booking.customer;

    const dispute = await Dispute.create({
      booking: bookingId,
      raisedBy: req.user._id,
      against,
      reason,
      description,
      desiredOutcome: desiredOutcome || 'partial_refund',
      evidence: evidence || [],
      status: 'open',
      messages: [
        {
          sender: req.user._id,
          message: description,
          createdAt: new Date()
        }
      ]
    });

    // Mark booking status as disputed
    booking.status = 'disputed';
    booking.trackingEvents.push({
      status: 'disputed',
      note: `Dispute filed by ${req.user.name}: ${reason}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });
    await booking.save();

    // Notify opposing party
    await Notification.create({
      user: against,
      title: 'Dispute Filed on Booking',
      message: `${req.user.name} filed a dispute regarding booking #${booking._id.toString().slice(-6)}. Our support team will mediate.`,
      type: 'dispute',
      link: `/support/disputes/${dispute._id}`
    });

    await logAudit({
      action: 'DISPUTE_RAISED',
      performedBy: req.user._id,
      targetResource: 'Dispute',
      targetId: dispute._id,
      details: { bookingId, reason }
    });

    res.status(201).json({ success: true, message: 'Dispute filed successfully', data: dispute });
  } catch (error) {
    next(error);
  }
};

// @desc Get disputes
// @route GET /api/disputes
const getDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'customer' || req.user.role === 'provider') {
      filter.$or = [{ raisedBy: req.user._id }, { against: req.user._id }];
    }

    const disputes = await Dispute.find(filter)
      .populate('booking')
      .populate('raisedBy', 'name email role avatar')
      .populate('against', 'name email role avatar')
      .populate('assignedAgent', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: disputes.length, data: disputes });
  } catch (error) {
    next(error);
  }
};

// @desc Get single dispute detail
// @route GET /api/disputes/:id
const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('booking')
      .populate('raisedBy', 'name email role phone avatar')
      .populate('against', 'name email role phone avatar')
      .populate('messages.sender', 'name role avatar')
      .populate('resolution.resolvedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};

// @desc Add message to dispute discussion
// @route POST /api/disputes/:id/messages
const addDisputeMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    dispute.messages.push({
      sender: req.user._id,
      message,
      createdAt: new Date()
    });

    if (dispute.status === 'open' && ['support', 'admin'].includes(req.user.role)) {
      dispute.status = 'under_review';
      dispute.assignedAgent = req.user._id;
    }

    await dispute.save();

    res.status(200).json({ success: true, message: 'Message sent', data: dispute.messages });
  } catch (error) {
    next(error);
  }
};

// @desc Resolve or Reject Dispute (Support Agent / Admin)
// @route PUT /api/disputes/:id/resolve
const resolveDispute = async (req, res, next) => {
  try {
    const { decision, refundAmount = 0, notes } = req.body;
    // decision: 'full_refund', 'partial_refund', 'rejected', 'rework_completed'

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    dispute.status = decision === 'rejected' ? 'rejected' : 'resolved';
    dispute.resolution = {
      decision,
      refundAmount,
      notes: notes || `Dispute resolved with decision: ${decision}`,
      resolvedBy: req.user._id,
      resolvedAt: new Date()
    };

    await dispute.save();

    // If refund requested and approved, update invoice
    if (refundAmount > 0 && ['full_refund', 'partial_refund'].includes(decision)) {
      await Invoice.findOneAndUpdate(
        { booking: dispute.booking },
        { paymentStatus: 'refunded' }
      );
    }

    // Update booking tracking
    const booking = await Booking.findById(dispute.booking);
    if (booking) {
      booking.trackingEvents.push({
        status: dispute.status === 'resolved' ? 'resolved' : 'dispute_rejected',
        note: `Dispute ${dispute.status} by Support (${req.user.name}): ${notes || decision}`,
        timestamp: new Date(),
        updatedBy: req.user._id
      });
      await booking.save();
    }

    // Notify both parties
    await Notification.create({
      user: dispute.raisedBy,
      title: `Dispute ${dispute.status.toUpperCase()}`,
      message: `Your dispute has been ${dispute.status}. Decision: ${decision}. Details: ${notes || ''}`,
      type: 'dispute',
      link: `/customer/bookings/${dispute.booking}`
    });

    await logAudit({
      action: 'DISPUTE_RESOLVED',
      performedBy: req.user._id,
      targetResource: 'Dispute',
      targetId: dispute._id,
      details: { decision, refundAmount, notes }
    });

    res.status(200).json({ success: true, message: `Dispute marked as ${dispute.status}`, data: dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getDisputes,
  getDisputeById,
  addDisputeMessage,
  resolveDispute
};
