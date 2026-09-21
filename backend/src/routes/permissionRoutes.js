const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticate, authorize } = require('../middleware/auth');

// Get current user's permissions
router.get('/my', authenticate, permissionController.getMyPermissions);

// Admin: Get all permissions with role assignments
router.get('/all', authenticate, authorize(['admin']), permissionController.getAllPermissions);

// Admin: Update permissions for a role
router.put('/role/:roleName', authenticate, authorize(['admin']), permissionController.updateRolePermissions);

module.exports = router;
