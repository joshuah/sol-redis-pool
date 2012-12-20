var redis = require('redis')
  , Pool = require('generic-pool').Pool;

function RedisPool(options) {
  this.options = options;	
  this.pool = Pool({
		name: 'redis',
		create: function(callback) {
			try {
				var client = redis.createClient(
					options.redis_port || 6379,
					options.redis_host || '127.0.0.1',
					options.redis_options || {}
				)
				// Handle the client authentication if provided.
				if(options.password) {
					client.auth(options.password)
				}
				callback(null, client);
			} catch(e) {
				callback(e, null)
			}
		},
		destroy: function(client) {
			client.end();
		},
		max: options.max_clients || 10,
    min: options.min_clients || 2,
    reapIntervalMillis: options.reapIntervalMillis || 1000,
    idleTimeoutMillis: options.idleTimeoutMillis || 30000,
    log: options.logging || false
	})
}

// Drains the connection pool.
RedisPool.prototype.drain = function(callback) {
	var self = this;
  self.pool.drain(function() {
    self.pool.destroyAllNow();
    callback();
  })
}

// Used to acquire a client connection.
RedisPool.prototype.acquire = function(callback) {
  this.pool.acquire(callback);
}

// Used to release a client connection.
RedisPool.prototype.release = function(client) {
  this.pool.release(client);
}

// Acquires a client and gives you two callbacks.
RedisPool.prototype.acquireHelper = function(errorCallback, clientCallback) {
	this.pool.acquire(function(err, client) {
		if(err) { return errorCallback(err, false);}
		return clientCallback(client);
	})
}

module.exports = RedisPool;
