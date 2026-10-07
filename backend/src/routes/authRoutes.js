const express = require('express');
const router = express.Router();
const {
  register,
  login,
  demoLogin,
  getMe,
  updateProfile,
  getStaffRequests,
  approveStaffRequest,
  rejectStaffRequest
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login/:role', demoLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Staff Registration Requests (Admin Only)
router.get('/admin/staff-requests', protect, authorize('admin'), getStaffRequests);
router.put('/admin/staff-requests/:id/approve', protect, authorize('admin'), approveStaffRequest);
router.put('/admin/staff-requests/:id/reject', protect, authorize('admin'), rejectStaffRequest);

module.exports = router;
