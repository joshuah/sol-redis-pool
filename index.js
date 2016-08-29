var redis = require('redis');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Pool = require('generic-pool').Pool;

var SUPPORTED_REDIS_OPTIONS = [
  'host', 'port', 'path', 'url', 'password',
  'string_numbers', 'return_buffers', 'detect_buffers', 
  'socket_keepalive', 'no_ready_check', 'enable_offline_queue',
  'retry_unfulfilled_commands', 'family', 'disable_resubscribing',
  'rename_commands', 'auth_pass', 'db', 'retry_strategy'
];

var SUPPORTED_POOL_OPTIONS = [
  'name', 'max', 'min', 'refreshIdle', 'idleTimeoutMillis',
  'reapIntervalMillis', 'returnToHead', 'priorityRange'
];

function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function copyAllowedKeys(allowed, source, destination) {
  function copyAllowedKey(key) {
    if (key in source) {
      destination[key] = source[key];
    }
  }
  allowed.forEach(copyAllowedKey);
  return destination;
}

function RedisPool(redisOptions, poolOptions) {
  var self = this;
  self._pool = null;
  self._redis_default_db = redisOptions.db || 0;
  self._redis_options = copyAllowedKeys(SUPPORTED_REDIS_OPTIONS, redisOptions, {});
  self._pool_options = copyAllowedKeys(SUPPORTED_POOL_OPTIONS, poolOptions, {});
}

util.inherits(RedisPool, EventEmitter);

// Initialize the RedisPool.
RedisPool.prototype._initialize = function() {
  var self = this;
  var redisSettings = self._redis_options;
  var poolSettings = self._pool_options;

  // Build new Redis database clients.
  poolSettings.create = function(cb) {
    // Create a new redis client.
    var client = redis.createClient(self._redis_options);

    // Handle client connection errors.
    client.on('error', function(err) {
      // Emit client connection errors to connection pool users.
      self.emit('error', err);
    });

    // Let the application know that a pool client is attempting to reconnect.
    client.on('reconnecting', function(delay, attempt) {
      self.emit('reconnecting', delay, attempt);
    })

    cb(null, client);
  };

  // The destroy function is called when client connection needs to be closed.
  poolSettings.destroy = function(client) {
    // Flush when closing.
    try {
      client.end(true);
      self.emit('destroy', null);
    } catch(err) {
      self.emit('destroy', err);
    }
  };

  // Now that the pool settings are ready create a pool instance.
  self._pool = Pool(poolSettings);
  return this;
};

// Acquire a database connection and use an optional priority.
RedisPool.prototype.acquire = function(cb, priority) {
  this._pool.acquire(cb, priority);
};

RedisPool.prototype.acquireDb = function(cb, db, priority) {
  this._pool.acquire(function(err, client) {
    if (!err && client._db_selected !== db) {
      client._db_selected = db;
      client.select(db);
    }
    return cb(err, client);
  }, priority);
};

// Release a database connection to the pool.
RedisPool.prototype.release = function(client) {
  var self = this;
  // Always reset the DB to the default. This prevents issues
  // if a user used the select command to change the DB.
  if (client._db_selected !== self._redis_default_db) {
    client.select(self._redis_default_db);
  }
  this._pool.release(client);
};

// Drains the connection pool and call the callback id provided.
RedisPool.prototype.drain = function(cb) {
  var self = this;
  self._pool.drain(function() {
    self._pool.destroyAllNow(cb);
  });
};

// Returns factory.name for this pool
RedisPool.prototype.getName = function() {
  return this._pool.getName();
};

// Returns number of resources in the pool regardless of
// whether they are free or in use
RedisPool.prototype.getPoolSize = function() {
  return this._pool.getPoolSize();
};

// Returns number of unused resources in the pool
RedisPool.prototype.availableObjectsCount = function() {
  return this._pool.availableObjectsCount();
};

// Returns number of callers waiting to acquire a resource
RedisPool.prototype.waitingClientsCount = function() {
  return this._pool.waitingClientsCount();
};

// Export this module.
module.exports = function(redisOptions, poolOptions) {
  return new RedisPool(redisOptions, poolOptions)._initialize();
};
