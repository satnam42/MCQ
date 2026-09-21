require('./env');

module.exports = {
  secret: process.env.JWT_SECRET || 'punjabi_lecturer_cadre_super_secret_jwt_key_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

