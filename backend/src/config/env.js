const path = require('path');
const dotenv = require('dotenv');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

// Load mode-specific env file (e.g. .env.development or .env.production)
dotenv.config({ path: envPath });
// Fallback to default .env if specific variables aren't defined
dotenv.config();

module.exports = {
  nodeEnv,
  envFile,
};
