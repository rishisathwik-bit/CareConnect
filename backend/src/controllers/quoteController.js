const Quote = require('../models/Quote');
const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { checkSlotAvailability } = require('../services/availabilityService');
const { logAudit } = require('../services/auditService');

// @desc Provider submits a quote
// @route POST /api/quotes
const createQuote = async (req, res, next) => {
  try {
    const { requestId, amount, estimatedHours, message, breakdown } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    if (!['open', 'quoted'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'This request is no longer accepting quotes' });
    }

    // Check if provider already submitted quote
    const existingQuote = await Quote.findOne({ request: requestId, provider: req.user._id });
    if (existingQuote) {
      return res.status(400).json({ success: false, message: 'You have already submitted a quote for this request' });
    }

    const quote = await Quote.create({
      request: requestId,
      provider: req.user._id,
      amount,
      estimatedHours: estimatedHours || 2,
      message,
      breakdown: breakdown || [{ description: 'Labor & Service', amount }]
    });

    request.status = 'quoted';
    await request.save();

    // Notify customer
    await Notification.create({
      user: request.customer,
      title: 'New Quote Received',
      message: `A provider has quoted $${amount} for your request: "${request.title}"`,
      type: 'quote',
      link: `/customer/requests/${request._id}`
    });

    await logAudit({
      action: 'QUOTE_SUBMITTED',
      performedBy: req.user._id,
      targetResource: 'Quote',
      targetId: quote._id,
      details: { requestId, amount }
    });

    res.status(201).json({ success: true, message: 'Quote submitted successfully', data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc Get quotes for a request
// @route GET /api/quotes/request/:requestId
const getQuotesForRequest = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ request: req.params.requestId })
      .populate('provider', 'name email phone avatar')
      .sort({ amount: 1 });

    res.status(200).json({ success: true, count: quotes.length, data: quotes });
  } catch (error) {
    next(error);
  }
};

// @desc Customer accepts a quote -> triggers booking & slot verification & invoice
// @route PUT /api/quotes/:id/accept
const acceptQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    const request = await ServiceRequest.findById(quote.request);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the request owner can accept this quote' });
    }

    // Check slot availability with strict conflict detection
    const slotCheck = await checkSlotAvailability(quote.provider, request.preferredDate, request.preferredSlot);
    if (!slotCheck.isAvailable) {
      return res.status(409).json({
        success: false,
        message: `Booking Conflict: ${slotCheck.reason}. Please select an alternative slot or provider.`
      });
    }

    // Update Quote statuses
    quote.status = 'accepted';
    await quote.save();

    // Decline other quotes
    await Quote.updateMany(
      { request: request._id, _id: { $ne: quote._id } },
      { $set: { status: 'declined' } }
    );

    // Update Request
    request.status = 'booked';
    request.assignedProvider = quote.provider;
    request.selectedQuote = quote._id;
    await request.save();

    // Calculate initial pricing
    const laborCost = quote.amount;
    const platformFee = Math.round(laborCost * 0.1 * 100) / 100; // 10% platform fee
    const tax = Math.round(laborCost * 0.0825 * 100) / 100; // 8.25% tax
    const totalAmount = Math.round((laborCost + platformFee + tax) * 100) / 100;

    // Create Booking
    const booking = await Booking.create({
      request: request._id,
      quote: quote._id,
      customer: request.customer,
      provider: quote.provider,
      category: request.category,
      scheduledDate: request.preferredDate,
      timeSlot: request.preferredSlot,
      serviceAddress: request.address,
      status: 'scheduled',
      pricing: {
        laborCost,
        partsCost: 0,
        platformFee,
        tax,
        totalAmount
      },
      trackingEvents: [
        {
          status: 'scheduled',
          note: `Booking confirmed for ${new Date(request.preferredDate).toLocaleDateString()} (${request.preferredSlot})`,
          timestamp: new Date(),
          updatedBy: req.user._id
        }
      ]
    });

    // Create Invoice
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      booking: booking._id,
      customer: request.customer,
      provider: quote.provider,
      items: [
        {
          description: `${request.title} - Service Labor`,
          quantity: 1,
          unitPrice: laborCost,
          amount: laborCost
        }
      ],
      subtotal: laborCost,
      platformFee,
      tax,
      totalAmount,
      paymentStatus: 'pending'
    });

    // Notify Provider
    await Notification.create({
      user: quote.provider,
      title: 'Quote Accepted! New Booking Scheduled',
      message: `Your quote of $${quote.amount} for "${request.title}" was accepted. Scheduled for ${new Date(request.preferredDate).toLocaleDateString()} (${request.preferredSlot}).`,
      type: 'booking',
      link: `/provider/bookings/${booking._id}`
    });

    await logAudit({
      action: 'QUOTE_ACCEPTED_BOOKING_CREATED',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { quoteId: quote._id, amount: totalAmount }
    });

    res.status(200).json({
      success: true,
      message: 'Quote accepted and booking created successfully',
      data: {
        booking,
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuote,
  getQuotesForRequest,
  acceptQuote
};
