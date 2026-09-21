const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User } = require('../models');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Strict Authentication Middleware
 * Ensures user MUST be logged in with a valid JWT token to access protected routes.
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please login to access content.', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return errorResponse(res, 'User account not found. Please login again.', 'USER_NOT_FOUND', 401);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED', 401);
    }
    return errorResponse(res, 'Invalid or expired session token. Please log in again.', 'INVALID_TOKEN', 401);
  }
};

/**
 * Authorization Middleware
 * Enforces role-based permissions (e.g. 'admin', 'candidate').
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden: Insufficient privileges for this section', 'FORBIDDEN', 403);
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches req.user if a valid Bearer token is present, but allows request to continue if missing.
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (err) {
    // Silently continue if token is missing or invalid
  }
  next();
};

/**
 * Permission-Based Authorization Middleware
 * Checks if the user's role has the required permission key in the database.
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    try {
      // Lazy-load models to avoid circular dependency
      const { Role, Permission, RolePermission } = require('../models');

      const roleRecord = await Role.findOne({ where: { name: req.user.role } });
      if (!roleRecord) {
        return errorResponse(res, 'Role not found in system', 'FORBIDDEN', 403);
      }

      const rolePermission = await RolePermission.findOne({
        where: { role_id: roleRecord.id },
        include: [{
          model: Permission,
          as: 'permission',
          where: { key: permissionKey },
        }],
      });

      if (!rolePermission) {
        return errorResponse(res, `Forbidden: Missing permission "${permissionKey}"`, 'FORBIDDEN', 403);
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      return errorResponse(res, 'Permission verification failed', 'INTERNAL_ERROR', 500);
    }
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  requirePermission,
};
