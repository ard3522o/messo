require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/messmgmt',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true',
  MEMORY_DB_PATH: process.env.MEMORY_DB_PATH || './.data/db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  QR_SECRET: process.env.QR_SECRET || process.env.JWT_SECRET || 'dev-only-qr-secret',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  PAYMENT_GATEWAY_ENABLED: process.env.PAYMENT_GATEWAY_ENABLED === 'true',
  PAYMENT_GATEWAY_KEY: process.env.PAYMENT_GATEWAY_KEY || '',
  MONTHLY_MESS_FEE: Number(process.env.MONTHLY_MESS_FEE || 3500),
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-only-secret-change-in-production') {
  throw new Error('JWT_SECRET must be configured in production');
}

module.exports = env;
