const { classifyServiceRequest, rankProviders } = require('../services/aiService');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceCategory = require('../models/ServiceCategory');

// @desc AI classify free-text service request
// @route POST /api/ai/classify-request
const classifyRequest = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide text description to classify' });
    }

    const classification = await classifyServiceRequest(text);

    // Also look up category ID if it exists in DB
    let categoryId = null;
    const cat = await ServiceCategory.findOne({ slug: classification.categorySlug });
    if (cat) {
      categoryId = cat._id;
    }

    res.status(200).json({
      success: true,
      data: {
        ...classification,
        categoryId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc AI rank suitable providers for a request
// @route POST /api/ai/rank-providers
const rankProvidersForRequest = async (req, res, next) => {
  try {
    const { categoryId, skills, address, preferredSlot, preferredDate } = req.body;

    const filter = { verificationStatus: 'verified' };
    if (categoryId) {
      filter.categories = categoryId;
    }

    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name email phone avatar address')
      .populate('categories', 'name icon basePrice');

    const ranked = rankProviders(
      {
        categoryId,
        skills: skills || [],
        address: address || {},
        preferredSlot,
        preferredDate
      },
      providers
    );

    res.status(200).json({
      success: true,
      count: ranked.length,
      data: ranked
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  classifyRequest,
  rankProvidersForRequest
};
