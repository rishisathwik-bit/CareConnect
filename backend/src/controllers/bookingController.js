const Booking = require('../models/Booking');
const ServiceRequest = require('../models/ServiceRequest');
const ProviderProfile = require('../models/ProviderProfile');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { checkSlotAvailability } = require('../services/availabilityService');
const { logAudit } = require('../services/auditService');

// @desc Get bookings based on user role and filters
// @route GET /api/bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, date, providerId, customerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) {
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.scheduledDate = { $gte: target, $lt: nextDay };
    }

    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      filter.provider = req.user._id;
    } else if (customerId) {
      filter.customer = customerId;
    } else if (providerId) {
      filter.provider = providerId;
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'name email phone avatar address')
      .populate('provider', 'name email phone avatar')
      .populate('category', 'name icon basePrice')
      .populate('request', 'title description urgency')
      .sort({ scheduledDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @desc Get single booking detail
// @route GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone avatar address')
      .populate('provider', 'name email phone avatar')
      .populate('category')
      .populate('request')
      .populate('quote')
      .populate('messages.sender', 'name role avatar');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Role check
    if (
      req.user.role === 'customer' && booking.customer._id.toString() !== req.user._id.toString() ||
      req.user.role === 'provider' && booking.provider._id.toString() !== req.user._id.toString()
    ) {
      if (!['admin', 'operations', 'support'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Also get invoice if exists
    const invoice = await Invoice.findOne({ booking: booking._id });

    res.status(200).json({ success: true, data: { ...booking.toObject(), invoice } });
  } catch (error) {
    next(error);
  }
};

// @desc Direct Booking of a verified provider
// @route POST /api/bookings/direct
const directBook = async (req, res, next) => {
  try {
    const { providerId, categoryId, scheduledDate, timeSlot, serviceAddress, description, estimatedHours = 2 } = req.body;

    // Check slot availability
    const slotCheck = await checkSlotAvailability(providerId, scheduledDate, timeSlot);
    if (!slotCheck.isAvailable) {
      return res.status(409).json({
        success: false,
        message: `Conflict: ${slotCheck.reason}. Please select an alternative slot.`
      });
    }

    const providerProfile = await ProviderProfile.findOne({ user: providerId });
    const hourlyRate = providerProfile ? providerProfile.hourlyRate : 50;
    const laborCost = hourlyRate * estimatedHours;
    const platformFee = Math.round(laborCost * 0.1 * 100) / 100;
    const tax = Math.round(laborCost * 0.0825 * 100) / 100;
    const totalAmount = Math.round((laborCost + platformFee + tax) * 100) / 100;

    // Create Service Request record
    const request = await ServiceRequest.create({
      customer: req.user._id,
      category: categoryId,
      title: description ? description.substring(0, 40) : 'Direct Service Booking',
      description: description || 'Direct Booking',
      address: serviceAddress || req.user.address,
      urgency: 'medium',
      preferredDate: scheduledDate,
      preferredSlot: timeSlot,
      status: 'booked',
      assignedProvider: providerId
    });

    const booking = await Booking.create({
      request: request._id,
      customer: req.user._id,
      provider: providerId,
      category: categoryId,
      scheduledDate,
      timeSlot,
      serviceAddress: serviceAddress || req.user.address,
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
          note: 'Direct booking scheduled by customer',
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
      customer: req.user._id,
      provider: providerId,
      items: [
        {
          description: `Direct Service Booking (${estimatedHours} hrs @ $${hourlyRate}/hr)`,
          quantity: estimatedHours,
          unitPrice: hourlyRate,
          amount: laborCost
        }
      ],
      subtotal: laborCost,
      platformFee,
      tax,
      totalAmount,
      paymentStatus: 'pending'
    });

    // Notify provider
    await Notification.create({
      user: providerId,
      title: 'New Direct Booking Received',
      message: `You have a new scheduled booking on ${new Date(scheduledDate).toLocaleDateString()} (${timeSlot})`,
      type: 'booking',
      link: `/provider/bookings/${booking._id}`
    });

    await logAudit({
      action: 'DIRECT_BOOKING_CREATED',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { providerId, totalAmount }
    });

    res.status(201).json({ success: true, message: 'Direct booking created successfully', data: { booking, invoice } });
  } catch (error) {
    next(error);
  }
};

// @desc Update booking lifecycle status (En Route, In Progress, Completed)
// @route PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note, partsCost } = req.body;
    const validStatuses = ['scheduled', 'en_route', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    booking.trackingEvents.push({
      status,
      note: note || `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    if (partsCost !== undefined && partsCost > 0) {
      booking.pricing.partsCost = partsCost;
      booking.pricing.totalAmount = Math.round((booking.pricing.laborCost + partsCost + booking.pricing.platformFee + booking.pricing.tax) * 100) / 100;

      // Also update invoice items if present
      await Invoice.findOneAndUpdate(
        { booking: booking._id },
        {
          $push: {
            items: { description: 'Replacement Parts & Materials', quantity: 1, unitPrice: partsCost, amount: partsCost }
          },
          $inc: { subtotal: partsCost, totalAmount: partsCost }
        }
      );
    }

    if (status === 'completed') {
      // Increment provider's completed jobs counter
      await ProviderProfile.findOneAndUpdate(
        { user: booking.provider },
        { $inc: { completedJobsCount: 1 } }
      );

      // Update Service Request status
      if (booking.request) {
        await ServiceRequest.findByIdAndUpdate(booking.request, { status: 'completed' });
      }

      // Notify customer
      await Notification.create({
        user: booking.customer,
        title: 'Job Completed – Confirm & Review',
        message: 'Your service provider marked the job as completed. Please review evidence and confirm completion.',
        type: 'booking',
        link: `/customer/bookings/${booking._id}`
      });
    }

    await booking.save();

    await logAudit({
      action: `BOOKING_STATUS_${status.toUpperCase()}`,
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { status, note }
    });

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc Upload Before/After Work Evidence
// @route POST /api/bookings/:id/evidence
const uploadEvidence = async (req, res, next) => {
  try {
    const { beforePhotos, afterPhotos, providerNotes } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.user._id.toString() && !['admin', 'operations'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only assigned provider can upload work evidence' });
    }

    booking.evidence = {
      beforePhotos: beforePhotos || booking.evidence?.beforePhotos || [],
      afterPhotos: afterPhotos || booking.evidence?.afterPhotos || [],
      providerNotes: providerNotes || booking.evidence?.providerNotes || '',
      submittedAt: new Date()
    };

    booking.trackingEvents.push({
      status: booking.status,
      note: 'Work evidence (before/after photos) uploaded by provider',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await booking.save();

    res.status(200).json({ success: true, message: 'Evidence uploaded successfully', data: booking.evidence });
  } catch (error) {
    next(error);
  }
};

// @desc Customer Confirms Job Completion
// @route PUT /api/bookings/:id/confirm
const confirmCompletion = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only customer can confirm job completion' });
    }

    booking.customerConfirmed = true;
    booking.customerConfirmedAt = new Date();
    booking.trackingEvents.push({
      status: 'completed',
      note: 'Job completion officially confirmed and approved by customer',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await booking.save();

    // Notify provider
    await Notification.create({
      user: booking.provider,
      title: 'Customer Approved Job Completion!',
      message: 'The customer has confirmed completion. Payment is now ready for settlement.',
      type: 'booking',
      link: `/provider/bookings/${booking._id}`
    });

    await logAudit({
      action: 'BOOKING_CUSTOMER_CONFIRMED',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id
    });

    res.status(200).json({ success: true, message: 'Job completion confirmed', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc Operations Manager Reassigns Provider
// @route PUT /api/bookings/:id/assign
const assignProvider = async (req, res, next) => {
  try {
    const { newProviderId, reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const previousProviderId = booking.provider;
    booking.provider = newProviderId;
    booking.trackingEvents.push({
      status: booking.status,
      note: `Reassigned to new provider by Operations (${req.user.name}). Reason: ${reason || 'Operations dispatch optimization'}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await booking.save();

    // Notify new provider
    await Notification.create({
      user: newProviderId,
      title: 'Booking Assigned by Operations',
      message: `You have been dispatched to booking #${booking._id.toString().slice(-6)} for ${new Date(booking.scheduledDate).toLocaleDateString()}`,
      type: 'booking',
      link: `/provider/bookings/${booking._id}`
    });

    await logAudit({
      action: 'BOOKING_REASSIGNED_BY_OPS',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { previousProviderId, newProviderId, reason }
    });

    res.status(200).json({ success: true, message: 'Provider reassigned successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel booking
// @route PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancelReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    booking.trackingEvents.push({
      status: 'cancelled',
      note: `Booking cancelled: ${booking.cancelReason}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await booking.save();

    if (booking.request) {
      await ServiceRequest.findByIdAndUpdate(booking.request, { status: 'cancelled' });
    }

    await logAudit({
      action: 'BOOKING_CANCELLED',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { reason }
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc Operations Manager Dispatches Open Request
// @route POST /api/bookings/dispatch
const dispatchRequest = async (req, res, next) => {
  try {
    const { requestId, providerId, scheduledDate, timeSlot, notes } = req.body;

    const request = await ServiceRequest.findById(requestId).populate('category');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const providerProfile = await ProviderProfile.findOne({ user: providerId });
    const hourlyRate = providerProfile ? providerProfile.hourlyRate : 60;
    const laborCost = hourlyRate * (request.aiClassification?.estimatedHours || 2);
    const platformFee = Math.round(laborCost * 0.1 * 100) / 100;
    const tax = Math.round(laborCost * 0.0825 * 100) / 100;
    const totalAmount = Math.round((laborCost + platformFee + tax) * 100) / 100;

    const dateToSchedule = scheduledDate || request.preferredDate || new Date();
    const slotToSchedule = timeSlot || request.preferredSlot || '09:00 - 12:00';

    const booking = await Booking.create({
      request: request._id,
      customer: request.customer,
      provider: providerId,
      category: request.category?._id || request.category,
      scheduledDate: dateToSchedule,
      timeSlot: slotToSchedule,
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
          note: `Dispatched by Operations (${req.user.name}). ${notes || 'Priority dispatch assignment.'}`,
          timestamp: new Date(),
          updatedBy: req.user._id
        }
      ]
    });

    // Create corresponding invoice
    const invCount = await Invoice.countDocuments();
    await Invoice.create({
      invoiceNumber: `INV-2026-${String(invCount + 1).padStart(3, '0')}`,
      booking: booking._id,
      customer: request.customer,
      provider: providerId,
      items: [
        {
          description: `${request.title} (${request.aiClassification?.estimatedHours || 2} hrs)`,
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

    // Update request
    request.status = 'booked';
    request.assignedProvider = providerId;
    await request.save();

    // Notify Provider
    await Notification.create({
      user: providerId,
      title: 'New Dispatch Assignment',
      message: `Operations assigned you to urgent job "${request.title}" on ${new Date(dateToSchedule).toLocaleDateString()}`,
      type: 'booking',
      link: `/provider/bookings/${booking._id}`
    });

    // Notify Customer
    await Notification.create({
      user: request.customer,
      title: 'Service Provider Dispatched!',
      message: `Operations assigned a verified technician to your request "${request.title}".`,
      type: 'booking',
      link: `/customer/bookings/${booking._id}`
    });

    await logAudit({
      action: 'REQUEST_DISPATCHED_BY_OPS',
      performedBy: req.user._id,
      targetResource: 'Booking',
      targetId: booking._id,
      details: { requestId, providerId, notes }
    });

    res.status(201).json({
      success: true,
      message: 'Request successfully dispatched to provider',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add in-booking message between customer and technician
// @route POST /api/bookings/:id/messages
const addBookingMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();
    const isStaff = ['admin', 'operations', 'support'].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to message on this booking' });
    }

    booking.messages.push({
      sender: req.user._id,
      message: message.trim(),
      createdAt: new Date()
    });

    await booking.save();

    // Send notification to recipient
    const recipientId = isCustomer ? booking.provider : booking.customer;
    await Notification.create({
      user: recipientId,
      title: `New Message from ${req.user.name}`,
      message: message.trim().length > 60 ? `${message.trim().substring(0, 60)}...` : message.trim(),
      type: 'booking',
      link: isCustomer ? `/provider/bookings/${booking._id}` : `/customer/bookings/${booking._id}`
    });

    const updatedBooking = await Booking.findById(booking._id).populate('messages.sender', 'name role avatar');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: updatedBooking.messages
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};


