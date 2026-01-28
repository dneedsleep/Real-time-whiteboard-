const Redis = require('ioredis');

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379
});

const pub = new Redis();
const sub = new Redis();

module.exports = { redis, pub, sub };
