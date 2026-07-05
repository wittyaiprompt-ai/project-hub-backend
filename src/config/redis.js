const { createClient } = require('redis');
const env = require('./env');

let pubClient = null;
let subClient = null;
let connected = false;

const initRedis = async () => {
  if (!env.redis.enabled) {
    return null;
  }

  try {
    pubClient = createClient({ url: env.redis.url });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('Redis pub error:', err.message));
    subClient.on('error', (err) => console.error('Redis sub error:', err.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    connected = true;
    console.log('Redis connected');

    return { pubClient, subClient };
  } catch (err) {
    console.error('Redis init failed, continuing without adapter:', err.message);
    connected = false;
    pubClient = null;
    subClient = null;
    return null;
  }
};

const isRedisConnected = () => connected;

const getRedisClients = () => ({ pubClient, subClient });

module.exports = { initRedis, getRedisClients, isRedisConnected };
