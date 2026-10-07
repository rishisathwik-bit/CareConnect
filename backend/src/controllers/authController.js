const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_dev_env', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc Register user
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'customer',
      phone,
      address,
      businessName,
      serviceAreas,
      hourlyRate,
      registrationNotes
    } = req.body;

    const validRoles = ['customer', 'provider', 'operations', 'support', 'admin'];
    const chosenRole = validRoles.includes(role) ? role : 'customer';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Operations Manager, Support Agent, and Admin require Admin approval
    const requiresAdminApproval = ['operations', 'support', 'admin'].includes(chosenRole);
    const approvalStatus = requiresAdminApproval ? 'pending' : 'approved';
    const isActive = !requiresAdminApproval;

    const user = await User.create({
      name,
      email,
      password,
      role: chosenRole,
      phone,
      address,
      approvalStatus,
      isActive,
      registrationNotes: registrationNotes || ''
    });

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.create({
        user: user._id,
        businessName: businessName || `${user.name}'s Services`,
        serviceAreas: serviceAreas || (address?.zipCode ? [address.zipCode] : ['94102']),
        hourlyRate: hourlyRate || 50,
        verificationStatus: 'pending'
      });
    }

    await logAudit({
      action: requiresAdminApproval ? 'STAFF_REGISTRATION_REQUESTED' : 'USER_REGISTERED',
      performedBy: user._id,
      targetResource: 'User',
      targetId: user._id,
      details: { role: user.role, email: user.email, approvalStatus }
    });

    if (requiresAdminApproval) {
      const roleLabel =
        chosenRole === 'operations'
          ? 'Operations Manager'
          : chosenRole === 'support'
          ? 'Support Agent'
          : 'Platform Admin';

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: `Registration request for ${roleLabel} submitted successfully. A Platform Administrator must review and approve your account before you can log in.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          approvalStatus: user.approvalStatus,
          isActive: user.isActive
        }
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        approvalStatus: user.approvalStatus,
        providerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Your registration request is pending Platform Administrator approval. Please wait for an administrator to review and activate your account.'
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        rejected: true,
        message: `Your registration request was declined by Platform Administrator.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ''}`
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('categories');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        providerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Demo 1-Click Login for evaluators
// @route POST /api/auth/demo-login/:role
const demoLogin = async (req, res, next) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'operations', 'provider', 'customer', 'support'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid demo role' });
    }

    const user = await User.findOne({ role, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: `No active demo user found for role: ${role}. Run database seed first.` });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('categories');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        providerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current logged in user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await ProviderProfile.findOne({ user: user._id }).populate('categories');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        providerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile, email and password
// @route PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, address, avatar, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Email update
    if (email && email.toLowerCase().trim() !== user.email) {
      const trimmedEmail = email.toLowerCase().trim();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }

      const existingEmail = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: user._id }
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'This email is already in use by another account' });
      }

      const oldEmail = user.email;
      user.email = trimmedEmail;

      await logAudit({
        action: 'USER_EMAIL_UPDATED',
        performedBy: user._id,
        targetResource: 'User',
        targetId: user._id,
        details: { oldEmail, newEmail: user.email }
      });
    }

    // 2. Password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'The current password you entered is incorrect'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      user.password = newPassword;

      await logAudit({
        action: 'USER_PASSWORD_UPDATED',
        performedBy: user._id,
        targetResource: 'User',
        targetId: user._id,
        details: { email: user.email }
      });
    }

    // 3. Profile details
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Re-generate fresh JWT token if email or password changed
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all staff registration requests (admin only)
// @route GET /api/auth/admin/staff-requests
const getStaffRequests = async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    const filter = { role: { $in: ['operations', 'support', 'admin'] } };
    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }
    const requests = await User.find(filter)
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc Approve staff registration request (admin only)
// @route PUT /api/auth/admin/staff-requests/:id/approve
const approveStaffRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.approvalStatus = 'approved';
    user.isActive = true;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();
    await user.save({ validateBeforeSave: false });

    await logAudit({
      action: 'STAFF_REGISTRATION_APPROVED',
      performedBy: req.user.id,
      targetResource: 'User',
      targetId: user._id,
      details: { name: user.name, email: user.email, role: user.role }
    });

    res.status(200).json({
      success: true,
      message: `Registration request for ${user.name} (${user.role}) has been approved and activated.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        approvedAt: user.approvedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reject staff registration request (admin only)
// @route PUT /api/auth/admin/staff-requests/:id/reject
const rejectStaffRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.approvalStatus = 'rejected';
    user.isActive = false;
    user.rejectionReason = reason || 'Declined by Administrator';
    await user.save({ validateBeforeSave: false });

    await logAudit({
      action: 'STAFF_REGISTRATION_REJECTED',
      performedBy: req.user.id,
      targetResource: 'User',
      targetId: user._id,
      details: { name: user.name, email: user.email, role: user.role, reason }
    });

    res.status(200).json({
      success: true,
      message: `Registration request for ${user.name} has been rejected.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
  updateProfile,
  getStaffRequests,
  approveStaffRequest,
  rejectStaffRequest
};
