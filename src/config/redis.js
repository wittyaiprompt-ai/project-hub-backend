const { createClient } = require('redis');
const env = require('./env');

let pubClient = null;
let subClient = null;
let connected = false;
let adapterReady = false;

const cleanup = async () => {
  const clients = [subClient, pubClient];
  for (const client of clients) {
    if (client?.isOpen) {
      try {
        await client.quit();
      } catch {
        // ignore disconnect errors
      }
    }
  }
  pubClient = null;
  subClient = null;
  connected = false;
  adapterReady = false;
};

const verifyPubSub = async (pub, sub) => {
  const channel = '__socket_adapter_check__';

  let received = false;
  await sub.subscribe(channel, () => {
    received = true;
  });

  await pub.publish(channel, '1');
  await new Promise((resolve) => setTimeout(resolve, 150));

  await sub.unsubscribe(channel);

  if (!received) {
    throw new Error('Pub/sub test failed');
  }
};

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

    try {
      await verifyPubSub(pubClient, subClient);
      adapterReady = true;
      console.log('Redis connected (Socket.IO adapter enabled)');
      return { pubClient, subClient };
    } catch (err) {
      const hint = err.message?.includes('NOPERM')
        ? ' (check Upstash: use read-write TCP URL with user "default", not "default_ro")'
        : '';
      console.warn(
        `Redis pub/sub unavailable — running without Socket.IO adapter${hint}:`,
        err.message
      );
      await cleanup();
      return null;
    }
  } catch (err) {
    console.error('Redis init failed, continuing without adapter:', err.message);
    await cleanup();
    return null;
  }
};

const getRedisStatus = () => {
  if (!env.redis.enabled) return 'disabled';
  if (adapterReady) return 'ready';
  return 'unavailable';
};

const isRedisConnected = () => connected;
const isRedisAdapterReady = () => adapterReady;
const getRedisClients = () => ({ pubClient, subClient });

module.exports = {
  initRedis,
  getRedisClients,
  isRedisConnected,
  isRedisAdapterReady,
  getRedisStatus,
};
