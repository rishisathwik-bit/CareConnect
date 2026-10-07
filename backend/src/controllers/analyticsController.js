const Booking = require('../models/Booking');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Invoice = require('../models/Invoice');
const Dispute = require('../models/Dispute');
const ProviderProfile = require('../models/ProviderProfile');
const PricingRule = require('../models/PricingRule');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../services/auditService');

// @desc Admin Platform Analytics
// @route GET /api/analytics/admin
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const customersCount = await User.countDocuments({ role: 'customer' });
    const providersCount = await User.countDocuments({ role: 'provider' });
    const verifiedProvidersCount = await ProviderProfile.countDocuments({ verificationStatus: 'verified' });
    const pendingVerificationCount = await ProviderProfile.countDocuments({ verificationStatus: 'pending' });

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['scheduled', 'en_route', 'in_progress'] } });
    const disputedBookings = await Booking.countDocuments({ status: 'disputed' });

    // Financial calculations
    const paidInvoices = await Invoice.find({ paymentStatus: 'paid' });
    const gmv = paidInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const platformRevenue = paidInvoices.reduce((acc, inv) => acc + (inv.platformFee || 0), 0);

    // Bookings by category
    const categoryStats = await Booking.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'servicecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          categoryName: { $ifNull: ['$categoryInfo.name', 'General Service'] },
          icon: '$categoryInfo.icon',
          count: 1,
          totalAmount: 1
        }
      }
    ]);

    // Pricing Rule
    let pricingRule = await PricingRule.findOne({ isActive: true });
    if (!pricingRule) {
      pricingRule = await PricingRule.create({
        name: 'Standard Platform Pricing',
        platformFeePercentage: 10,
        taxPercentage: 8.25,
        minimumBookingFee: 35
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          customers: customersCount,
          providers: providersCount,
          verifiedProviders: verifiedProvidersCount,
          pendingVerification: pendingVerificationCount
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          active: activeBookings,
          disputed: disputedBookings
        },
        financials: {
          gmv: Math.round(gmv * 100) / 100,
          platformRevenue: Math.round(platformRevenue * 100) / 100,
          averageOrderValue: completedBookings > 0 ? Math.round((gmv / completedBookings) * 100) / 100 : 0
        },
        categoryStats,
        pricingRule
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Operations Metrics & Live Dispatch Board
// @route GET /api/analytics/operations
const getOperationsMetrics = async (req, res, next) => {
  try {
    const scheduled = await Booking.countDocuments({ status: 'scheduled' });
    const enRoute = await Booking.countDocuments({ status: 'en_route' });
    const inProgress = await Booking.countDocuments({ status: 'in_progress' });
    const completed = await Booking.countDocuments({ status: 'completed' });
    const cancelled = await Booking.countDocuments({ status: 'cancelled' });
    const disputed = await Booking.countDocuments({ status: 'disputed' });

    // Urgent requests needing provider attention
    const unassignedUrgentRequests = await ServiceRequest.find({
      urgency: { $in: ['emergency', 'high'] },
      status: 'open'
    })
      .populate('category', 'name icon')
      .populate('customer', 'name phone address')
      .sort({ createdAt: 1 })
      .limit(10);

    // Open disputes requiring mediation
    const openDisputesCount = await Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } });

    // Active bookings list with provider and customer
    const activeDispatches = await Booking.find({
      status: { $in: ['scheduled', 'en_route', 'in_progress'] }
    })
      .populate('provider', 'name email phone avatar')
      .populate('customer', 'name email phone avatar address')
      .populate('category', 'name icon')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          scheduled,
          enRoute,
          inProgress,
          completed,
          cancelled,
          disputed,
          totalActive: scheduled + enRoute + inProgress,
          openDisputesCount
        },
        unassignedUrgentRequests,
        activeDispatches
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get or update platform pricing rules (Admin only)
// @route GET /api/analytics/pricing-rules
const getPricingRule = async (req, res, next) => {
  try {
    let rule = await PricingRule.findOne({ isActive: true });
    if (!rule) {
      rule = await PricingRule.create({ name: 'Standard Platform Pricing' });
    }
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/analytics/pricing-rules
const updatePricingRule = async (req, res, next) => {
  try {
    const { platformFeePercentage, taxPercentage, minimumBookingFee, urgencySurgeMultiplier } = req.body;
    let rule = await PricingRule.findOne({ isActive: true });
    if (!rule) {
      rule = new PricingRule();
    }

    if (platformFeePercentage !== undefined) rule.platformFeePercentage = platformFeePercentage;
    if (taxPercentage !== undefined) rule.taxPercentage = taxPercentage;
    if (minimumBookingFee !== undefined) rule.minimumBookingFee = minimumBookingFee;
    if (urgencySurgeMultiplier) rule.urgencySurgeMultiplier = urgencySurgeMultiplier;

    await rule.save();

    await logAudit({
      action: 'PRICING_RULE_UPDATED',
      performedBy: req.user._id,
      targetResource: 'PricingRule',
      targetId: rule._id,
      details: req.body
    });

    res.status(200).json({ success: true, message: 'Pricing rules updated', data: rule });
  } catch (error) {
    next(error);
  }
};

// @desc Get System Audit Logs
// @route GET /api/analytics/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAnalytics,
  getOperationsMetrics,
  getPricingRule,
  updatePricingRule,
  getAuditLogs
};
