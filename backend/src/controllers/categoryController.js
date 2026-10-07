const ServiceCategory = require('../models/ServiceCategory');
const { logAudit } = require('../services/auditService');

// @desc Get all service categories
// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await ServiceCategory.find(filter).sort({ popular: -1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc Get single category
// @route GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc Create service category (Admin only)
// @route POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, basePrice, hourlyRateEstimate, skillsList, popular } = req.body;
    const category = await ServiceCategory.create({
      name,
      description,
      icon,
      basePrice,
      hourlyRateEstimate,
      skillsList,
      popular
    });

    await logAudit({
      action: 'CATEGORY_CREATED',
      performedBy: req.user._id,
      targetResource: 'ServiceCategory',
      targetId: category._id,
      details: { name: category.name }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc Update service category (Admin only)
// @route PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logAudit({
      action: 'CATEGORY_UPDATED',
      performedBy: req.user._id,
      targetResource: 'ServiceCategory',
      targetId: category._id,
      details: req.body
    });

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc Delete/Deactivate service category (Admin only)
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = false;
    await category.save();

    await logAudit({
      action: 'CATEGORY_DEACTIVATED',
      performedBy: req.user._id,
      targetResource: 'ServiceCategory',
      targetId: category._id
    });

    res.status(200).json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
