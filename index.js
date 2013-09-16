var redis = require('redis')
  , Pool = require('generic-pool').Pool;

function RedisPool(options) {
  if(!options) options = {redis_options:{auth_pass: null}}
	if(!options.redis_options) options['redis_options'] = {auth_pass: null}
	
	// Accept a password set byt using .redis_password, .password or .auth_pass. In the future
	// I will require that the password be set under the redis_options settings.
	if(options.redis_password) options['redis_options']['auth_pass'] = options.redis_password
	if(options.password) options['redis_options']['auth_pass'] = options.password
	if(options.auth_pass) options['redis_options']['auth_pass'] = options.auth_pass
	
  this.options = options;
	
  this.pool = Pool({
		name: 'redis',
		create: function(callback) {
			try {
				var client = null
				if(options.unix_socket) {
				  client = redis.createClient(options.unix_socket, null, options.redis_options || {})	
				} else {
					client = redis.createClient(
					  options.redis_port || 6379,
					  options.redis_host || '127.0.0.1',
					  options.redis_options || {}
				  )
				}
				
				// Handle the client authentication if provided.
				if(options.redis_options.auth_pass) {
					client.auth(options.redis_options.auth_pass)
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
// This will be removed in the future...
RedisPool.prototype.acquireHelper = function(errorCallback, clientCallback) {
	this.pool.acquire(function(err, client) {
		if(err) { return errorCallback(err, false);}
		return clientCallback(client);
	})
}

module.exports = RedisPool;
