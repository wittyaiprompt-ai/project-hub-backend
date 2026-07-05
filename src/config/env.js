require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

const normalizeUrl = (url) => url.replace(/\/+$/, '');

const parseClientUrls = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  return [...new Set(raw.split(',').map((u) => normalizeUrl(u.trim())).filter(Boolean))];
};

const clientUrls = parseClientUrls();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  clientUrls,
  clientUrl: clientUrls[0],
};
