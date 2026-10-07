const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const { getProviderAvailableSlots } = require('../services/availabilityService');
const { logAudit } = require('../services/auditService');

// @desc Get all verified providers with filters
// @route GET /api/providers
const getProviders = async (req, res, next) => {
  try {
    const { category, area, search, minRating, verifiedOnly = 'true' } = req.query;

    const filter = {};
    if (verifiedOnly === 'true') {
      filter.verificationStatus = 'verified';
    }

    if (category) {
      filter.categories = category;
    }

    if (area) {
      filter.serviceAreas = { $in: [new RegExp(area, 'i')] };
    }

    if (minRating) {
      filter.ratingAverage = { $gte: parseFloat(minRating) };
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('categories', 'name icon basePrice')
      .sort({ ratingAverage: -1, completedJobsCount: -1 });

    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    next(error);
  }
};

// @desc Get single provider profile by ID
// @route GET /api/providers/:id
const getProviderById = async (req, res, next) => {
  try {
    const provider = await ProviderProfile.findById(req.params.id)
      .populate('user', 'name email phone avatar createdAt')
      .populate('categories');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

// @desc Get current provider's own profile
// @route GET /api/providers/profile/me
const getMyProviderProfile = async (req, res, next) => {
  try {
    let profile = await ProviderProfile.findOne({ user: req.user._id }).populate('categories');
    if (!profile) {
      profile = await ProviderProfile.create({
        user: req.user._id,
        businessName: `${req.user.name}'s Services`,
        serviceAreas: ['94102', 'San Francisco']
      });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc Update current provider's profile
// @route PUT /api/providers/profile/me
const updateMyProviderProfile = async (req, res, next) => {
  try {
    const { businessName, bio, categories, skills, hourlyRate, experienceYears, serviceAreas } = req.body;

    let profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new ProviderProfile({ user: req.user._id });
    }

    if (businessName) profile.businessName = businessName;
    if (bio !== undefined) profile.bio = bio;
    if (categories) profile.categories = categories;
    if (skills) profile.skills = skills;
    if (hourlyRate) profile.hourlyRate = hourlyRate;
    if (experienceYears !== undefined) profile.experienceYears = experienceYears;
    if (serviceAreas) profile.serviceAreas = serviceAreas;

    await profile.save();
    const updated = await ProviderProfile.findById(profile._id).populate('categories');

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc Update provider availability schedule
// @route PUT /api/providers/profile/me/availability
const updateAvailability = async (req, res, next) => {
  try {
    const { workingDays, slots, blackoutDates } = req.body;

    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    if (workingDays) profile.availability.workingDays = workingDays;
    if (slots) profile.availability.slots = slots;
    if (blackoutDates) profile.availability.blackoutDates = blackoutDates;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Availability schedule updated',
      data: profile.availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get provider slots for a date
// @route GET /api/providers/:id/slots
const getSlotsForDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date query parameter' });
    }

    // req.params.id can be providerProfileId or userId
    let providerId = req.params.id;
    const profile = await ProviderProfile.findById(req.params.id);
    if (profile) {
      providerId = profile.user;
    }

    const slots = await getProviderAvailableSlots(providerId, date);
    res.status(200).json({ success: true, date, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc Upload verification document
// @route POST /api/providers/profile/me/documents
const uploadDocument = async (req, res, next) => {
  try {
    const { docType, title, fileUrl: bodyUrl } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : bodyUrl;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a document file or provide a valid document URL' });
    }

    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    profile.documents.push({
      docType: docType || 'license',
      title: title || (req.file ? req.file.originalname : 'Verification Credential'),
      fileUrl,
      status: 'pending',
      uploadedAt: new Date()
    });

    profile.verificationStatus = 'pending';
    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Document submitted successfully. Status is now pending admin audit.',
      data: profile.documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc Admin: Verify/Reject Provider
// @route PUT /api/providers/:id/verify
const verifyProvider = async (req, res, next) => {
  try {
    const { status, verificationNotes } = req.body; // status: 'verified', 'rejected', 'suspended'

    const profile = await ProviderProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    profile.verificationStatus = status;
    profile.verificationNotes = verificationNotes || profile.verificationNotes;
    profile.verifiedBy = req.user._id;
    profile.verifiedAt = status === 'verified' ? new Date() : profile.verifiedAt;

    // Also update document status if approved
    if (status === 'verified' && profile.documents.length > 0) {
      profile.documents.forEach(doc => {
        doc.status = 'approved';
      });
    }

    await profile.save();

    await logAudit({
      action: `PROVIDER_${status.toUpperCase()}`,
      performedBy: req.user._id,
      targetResource: 'ProviderProfile',
      targetId: profile._id,
      details: { status, verificationNotes }
    });

    res.status(200).json({
      success: true,
      message: `Provider status set to ${status}`,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc Admin / Operations: Get all providers including pending verification
// @route GET /api/providers/admin/all
const getAllProvidersAdmin = async (req, res, next) => {
  try {
    const providers = await ProviderProfile.find()
      .populate('user', 'name email phone avatar isActive createdAt')
      .populate('categories', 'name icon')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  updateAvailability,
  getSlotsForDate,
  uploadDocument,
  verifyProvider,
  getAllProvidersAdmin
};
