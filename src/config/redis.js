const { createClient } = require('redis');
const env = require('./env');

let pubClient = null;
let subClient = null;

const initRedis = async () => {
  if (!env.redis.enabled) {
    return null;
  }

  pubClient = createClient({ url: env.redis.url });
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis pub error:', err.message));
  subClient.on('error', (err) => console.error('Redis sub error:', err.message));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log('Redis connected');

  return { pubClient, subClient };
};

const getRedisClients = () => ({ pubClient, subClient });

module.exports = { initRedis, getRedisClients };
