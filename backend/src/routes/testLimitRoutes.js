const express = require('express');
const router = express.Router();
const testLimitController = require('../controllers/testLimitController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

// Disable browser caching for test-limits and quotas endpoints
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

router.get('/my-quotas', testLimitController.getMyQuotas);

router.get('/roles', requirePermission('MANAGE_TEST_LIMITS'), testLimitController.getRoleLimits);
router.get('/roles/:roleId', requirePermission('MANAGE_TEST_LIMITS'), testLimitController.getRoleLimits);
router.put('/roles', requirePermission('MANAGE_TEST_LIMITS'), testLimitController.updateRoleLimits);
router.put('/roles/:roleId', requirePermission('MANAGE_TEST_LIMITS'), testLimitController.updateRoleLimits);

router.get('/users/:userId', requirePermission('MANAGE_USER_LIMITS'), testLimitController.getUserLimits);
router.put('/users/:userId', requirePermission('MANAGE_USER_LIMITS'), testLimitController.updateUserLimits);

module.exports = router;
