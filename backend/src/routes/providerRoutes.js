const express = require('express');
const router = express.Router();
const {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  updateAvailability,
  getSlotsForDate,
  uploadDocument,
  verifyProvider,
  getAllProvidersAdmin
} = require('../controllers/providerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

router.get('/', getProviders);
router.get('/admin/all', protect, authorize('admin', 'operations'), getAllProvidersAdmin);
router.get('/profile/me', protect, authorize('provider'), getMyProviderProfile);
router.put('/profile/me', protect, authorize('provider'), updateMyProviderProfile);
router.put('/profile/me/availability', protect, authorize('provider'), updateAvailability);
router.post('/profile/me/documents', protect, authorize('provider'), upload.single('document'), uploadDocument);
router.get('/:id/slots', getSlotsForDate);
router.put('/:id/verify', protect, authorize('admin'), verifyProvider);
router.get('/:id', getProviderById);

module.exports = router;
