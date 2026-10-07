const express = require('express');
const router = express.Router();
const {
  getAdminAnalytics,
  getOperationsMetrics,
  getPricingRule,
  updatePricingRule,
  getAuditLogs
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/operations', protect, authorize('admin', 'operations'), getOperationsMetrics);
router.get('/pricing-rules', protect, authorize('admin'), getPricingRule);
router.put('/pricing-rules', protect, authorize('admin'), updatePricingRule);
router.get('/audit-logs', protect, authorize('admin', 'operations'), getAuditLogs);

module.exports = router;
