const ServiceRequest = require('../models/ServiceRequest');
const ServiceCategory = require('../models/ServiceCategory');
const ProviderProfile = require('../models/ProviderProfile');
const Quote = require('../models/Quote');
const { classifyServiceRequest } = require('../services/aiService');
const { logAudit } = require('../services/auditService');

// @desc Create new service request with AI classification
// @route POST /api/requests
const createRequest = async (req, res, next) => {
  try {
    const { title, description, categoryId, address, urgency, preferredDate, preferredSlot, budget, photos } = req.body;

    // Run AI classification on the free-text description
    const aiClassification = await classifyServiceRequest(description || title);

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && aiClassification.categorySlug) {
      const matchedCat = await ServiceCategory.findOne({ slug: aiClassification.categorySlug });
      if (matchedCat) {
        resolvedCategoryId = matchedCat._id;
      }
    }

    if (!resolvedCategoryId) {
      const fallbackCat = await ServiceCategory.findOne({ isActive: true });
      resolvedCategoryId = fallbackCat ? fallbackCat._id : null;
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      category: resolvedCategoryId,
      title: title || `${aiClassification.categoryName} Service`,
      description,
      address: address || req.user.address,
      urgency: urgency || aiClassification.urgencyLevel,
      preferredDate: preferredDate || new Date(+new Date() + 24 * 60 * 60 * 1000),
      preferredSlot: preferredSlot || '09:00 - 12:00',
      budget: budget || aiClassification.estimatedPriceRange.min,
      photos: photos || [],
      aiClassification,
      status: 'open'
    });

    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('category', 'name icon basePrice')
      .populate('customer', 'name email phone avatar');

    await logAudit({
      action: 'REQUEST_CREATED',
      performedBy: req.user._id,
      targetResource: 'ServiceRequest',
      targetId: serviceRequest._id,
      details: { title: serviceRequest.title, category: aiClassification.categoryName }
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get service requests based on user role
// @route GET /api/requests
const getRequests = async (req, res, next) => {
  try {
    const { status, category, urgency } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      // Find open requests matching provider's categories
      const profile = await ProviderProfile.findOne({ user: req.user._id });
      if (profile && profile.categories.length > 0) {
        filter.category = { $in: profile.categories };
      }
      // Providers only browse open or quoted requests
      if (!status) {
        filter.status = { $in: ['open', 'quoted'] };
      }
    }
    // Admin and Operations can see all requests

    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'name email phone avatar address')
      .populate('category', 'name icon basePrice')
      .populate('assignedProvider', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc Get single service request with quotes
// @route GET /api/requests/:id
const getRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name email phone avatar address')
      .populate('category', 'name icon basePrice skillsList')
      .populate('assignedProvider', 'name email phone avatar');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const quotes = await Quote.find({ request: request._id })
      .populate('provider', 'name email phone avatar')
      .sort({ amount: 1 });

    res.status(200).json({ success: true, data: { ...request.toObject(), quotes } });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel service request
// @route PUT /api/requests/:id/cancel
const cancelRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only owner or staff can cancel
    if (request.customer.toString() !== req.user._id.toString() && !['admin', 'operations', 'support'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (['in_progress', 'completed'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel request that is in progress or completed' });
    }

    request.status = 'cancelled';
    await request.save();

    await logAudit({
      action: 'REQUEST_CANCELLED',
      performedBy: req.user._id,
      targetResource: 'ServiceRequest',
      targetId: request._id
    });

    res.status(200).json({ success: true, message: 'Request cancelled successfully', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  cancelRequest
};
