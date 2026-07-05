const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { corsOptions } = require('./config/cors');
const connectDB = require('./config/db');
const { initRedis, getRedisStatus } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');
const { initSockets } = require('./sockets');

let ready = false;


const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  if (!ready) {
    return res.status(503).json({
      success: false,
      message: 'Starting up',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: 'OK',
    timestamp: new Date().toISOString(),
    redis: getRedisStatus(),
  });
});

app.use('/api', (req, res, next) => {
  if (!ready) {
    return res.status(503).json({ success: false, message: 'Server starting up' });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const start = async () => {
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`Server listening on port ${env.port} [${env.nodeEnv}]`);
    console.log(`CORS origins: ${env.clientUrls.join(', ')}`);
  });

  try {
    await connectDB();
    const redisClients = await initRedis();
    const io = await initSockets(server, redisClients);
    app.set('io', io);
    ready = true;
    console.log('Server ready');
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
