/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , Pool = require('generic-pool').Pool
  , redis = require('redis');

var SUPPORTED_REDIS_OPTIONS = [
    "parser", "return_buffers", "detect_buffers", "socket_nodelay",
    "socket_keepalive", "no_ready_check", "enable_offline_queue",
    "retry_max_delay", "connect_timeout", "max_attempts", "family",
    "auth_pass"
];

var SUPPORTED_POOL_OPTIONS = [
    "name", "max", "min", "refreshIdle", "idleTimeoutMillis",
    "reapIntervalMillis", "returnToHead","priorityRange"
];

function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function copyAllowedKeys(allowed, source, destination) {
    function copyAllowedKey(key) {
        if(key in source) {
            destination[key] = source[key];
        }
    }
    allowed.forEach(copyAllowedKey);
    return destination;
}

function RedisPool(redisOptions, poolOptions) {
    var self = this;
    self._pool = null;
    self._redis_host = redisOptions.host || null;
    self._redis_port = redisOptions.port || null;
    self._redis_unix_socket = redisOptions.unix_socket || null;
    self._redis_options = copyAllowedKeys(SUPPORTED_REDIS_OPTIONS, redisOptions, {});
    self._pool_options = copyAllowedKeys(SUPPORTED_POOL_OPTIONS, poolOptions, {});
}
util.inherits(RedisPool, EventEmitter);

// Initialize the RedisPool.
RedisPool.prototype._initialize = function _initialize() {
    var self = this;
    var redisSettings = self._redis_options;
    var poolSettings = self._pool_options;
    
    // Build new Redis database clients.
    poolSettings["create"] = function Create(cb) {
        var client = null;

        // Detect if application wants to use Unix sockets or TCP connections.
        if (self._redis_unix_socket != null) {
            client = redis.createClient(self._redis_unix_socket, null, self._redis_options);
        } else {
            client = redis.createClient(self._redis_port, self._redis_host, self._redis_options);    
        }
        
        // Handle client connection errors.
        client.on("error", clientErrorCallback);
        
        function clientErrorCallback(err) {
            // Emit client connection errors to connection pool users.
            self.emit("error", err);
        }

        // Register the authentication password if needed.
        if (redisSettings.auth_pass) {
            client.auth(redisSettings.auth_pass);
        }
        
        cb(null, client);
    }
    
    // The destroy function is called when client connection needs to be closed.
    poolSettings["destroy"] = function destroyClient(client) {
        client.end();
        self.emit("destroy", null);
    }
    
    // Now that the pool settings are ready create a pool instance.
    self._pool = Pool(poolSettings);
    return this;
}

// Acquire a database connection and use an optional priority.
RedisPool.prototype.acquire = function acquireClient(cb, priority) {
    this._pool.acquire(cb, priority);
}
// Release a database connection to the pool.
RedisPool.prototype.release = function releaseClient(client) {
     this._pool.release(client);
}

// Drains the connection pool and call the callback id provided.
RedisPool.prototype.drain = function drainRedisPool(cb) {
    var self = this;
    self._pool.drain(function() {
        self._pool.destroyAllNow();
        if (isFunction(cb)) {
            cb();    
        }
    });
}

// Returns factory.name for this pool
RedisPool.prototype.getName = function getName(){
    return this._pool.getName();
}

// Returns number of resources in the pool regardless of
// whether they are free or in use
RedisPool.prototype.getPoolSize = function getPoolSize(){
    return this._pool.getPoolSize();
}

// Returns number of unused resources in the pool
RedisPool.prototype.availableObjectsCount = function availableObjectsCount() {
    return this._pool.availableObjectsCount();
}

// Returns number of callers waiting to acquire a resource
RedisPool.prototype.waitingClientsCount = function waitingClientsCount() {
    return this._pool.waitingClientsCount();    
}

// Export this module.
module.exports = function createPool(redisOptions, poolOptions) {
    return new RedisPool(redisOptions, poolOptions)._initialize();
};
