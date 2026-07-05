const env = require('./env');

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return env.clientUrls.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
};

const socketCors = {
  origin: env.clientUrls,
  methods: ['GET', 'POST'],
  credentials: true,
};

module.exports = { corsOptions, socketCors, isAllowedOrigin };
