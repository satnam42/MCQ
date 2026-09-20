const { Role, Permission, RolePermission } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get permissions for the currently logged-in user's role.
 * GET /api/permissions/my
 */
const getMyPermissions = async (req, res, next) => {
  try {
    const roleRecord = await Role.findOne({
      where: { name: req.user.role },
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['key', 'label', 'group'],
        through: { attributes: [] },
      }],
    });

    if (!roleRecord) {
      return successResponse(res, { permissions: [] });
    }

    const permissionKeys = roleRecord.permissions.map(p => p.key);
    return successResponse(res, { permissions: permissionKeys });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all permissions with role assignments (admin only).
 * GET /api/permissions/all
 */
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll({
      order: [['group', 'ASC'], ['id', 'ASC']],
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      }],
    });

    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']],
    });

    const formattedPermissions = permissions.map(p => ({
      id: p.id,
      key: p.key,
      label: p.label,
      group: p.group,
      description: p.description,
      assignedRoles: p.roles.map(r => r.name),
    }));

    return successResponse(res, { permissions: formattedPermissions, roles });
  } catch (err) {
    next(err);
  }
};

/**
 * Update permissions for a specific role.
 * PUT /api/permissions/role/:roleName
 * Body: { permissions: ['HOME_VIEW', 'PRACTICE_VIEW', ...] }
 */
const updateRolePermissions = async (req, res, next) => {
  try {
    const { roleName } = req.params;
    const { permissions: permissionKeys } = req.body;

    if (!Array.isArray(permissionKeys)) {
      return errorResponse(res, 'permissions must be an array of permission keys', 'VALIDATION_ERROR', 400);
    }

    const roleRecord = await Role.findOne({ where: { name: roleName } });
    if (!roleRecord) {
      return errorResponse(res, `Role "${roleName}" not found`, 'NOT_FOUND', 404);
    }

    // Get permission records for the provided keys
    const permissionRecords = await Permission.findAll({
      where: { key: permissionKeys },
    });

    // Delete all existing role-permission mappings for this role
    await RolePermission.destroy({ where: { role_id: roleRecord.id } });

    // Create new mappings
    const newMappings = permissionRecords.map(p => ({
      role_id: roleRecord.id,
      permission_id: p.id,
    }));

    if (newMappings.length > 0) {
      await RolePermission.bulkCreate(newMappings);
    }

    return successResponse(res, {
      role: roleName,
      permissionsCount: newMappings.length,
    }, `Permissions updated for role "${roleName}"`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPermissions,
  getAllPermissions,
  updateRolePermissions,
};
