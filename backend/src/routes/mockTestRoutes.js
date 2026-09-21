const express = require('express');
const router = express.Router();
const mockTestController = require('../controllers/mockTestController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// User Endpoints
router.get('/config', mockTestController.getUserConfig);
router.post('/generate', mockTestController.generateMockTest);

// Admin Endpoints
router.get('/settings', authorize(['admin']), mockTestController.getAdminSettings);
router.put('/settings', authorize(['admin']), mockTestController.updateAdminSettings);
router.put('/users/:userId/mock-test-permission', authorize(['admin']), mockTestController.updateUserPermission);
router.put('/users/:userId/mock-test-limit', authorize(['admin']), mockTestController.updateUserLimit);
router.get('/dashboard-stats', authorize(['admin']), mockTestController.getDashboardStats);
router.get('/audit-logs', authorize(['admin']), mockTestController.getAuditLogs);

module.exports = router;
