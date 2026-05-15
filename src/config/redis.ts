import Redis from 'ioredis';

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: false, enableOfflineQueue: false })
  : null;

export default redis;
