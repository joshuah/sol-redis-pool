var redis = require('redis')
  , Pool = require('generic-pool').Pool;

var RedisPool = Pool({
  name: 'redis',
  create: function(callback) {
    callback(null, redis.createClient(global.settings.redis_port || 6379, global.settings.redis_host || '127.0.0.1'));
  },
  destroy: function(client) { client.end();},
  max: global.settings.redis_max || 10,
  min: global.settings.redis_min || 2,
  reapIntervalMillis: global.settings.redis_reap_timeout || 1000,
  idleTimeoutMillis: global.settings.redis_timeout || 30000,
  log: global.settings.redis_log_pool || false
});

// You can use this function to drain the pool.
RedisPool.Drain = function(pool, callback) {
  pool.drain(function() {
    pool.destroyAllNow();
    callback();
  })
}
// The AcquireHelper is a shortcut for acquiring a client and handling errors.
RedisPool.AcquireHelper = function AcquireHelper(errorCallback, successCallback) {
	RedisPool.acquire(function(err, client) {
		if(err) { return errorCallback(err, false);}
		return successCallback(client);
	})
}
module.exports = RedisPool;
