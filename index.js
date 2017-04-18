var redis = require('redis');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Pool = require('generic-pool').Pool;
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var SUPPORTED_REDIS_OPTIONS = [
  'host', 'port', 'path', 'url', 'password',
  'string_numbers', 'return_buffers', 'detect_buffers', 
  'socket_keepalive', 'no_ready_check', 'enable_offline_queue',
  'retry_unfulfilled_commands', 'family', 'disable_resubscribing',
  'rename_commands', 'auth_pass', 'db', 'retry_strategy', 'tls', 'prefix'
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

  // The next connection id number for tracking.
  var nextCid = 0;

  // Build new Redis database clients.
  poolSettings.create = function(cb) {
    // Create a new redis client.
    var client = redis.createClient(self._redis_options);

    // Assign an unique connection id to this redis client.
    client._sol_cid = ++nextCid;

    // Handle client connection errors.
    client.on('error', function(err) {
      // Add the client connection id (cid) to the error data before it is emitted.
      err["cid"] = client._sol_cid;
      self.emit('error', err);
    });

    // Let the application know that a pool client is attempting to reconnect.
    client.on('reconnecting', function(info) {
      // Add the client connection id (cid) to the reconnecting event data before it is emitted.
      info['cid'] = client._sol_cid;
      self.emit('reconnecting', info);
    });

    cb(null, client);
  };

  // The destroy function is called when client connection needs to be closed.
  poolSettings.destroy = function(client) {
    var _cid = null;
    var _err = null;
    try {
      _cid = client._sol_cid;
      // Always flush when closing.
      client.end(true); 
    } catch(err) {
      _err = err;
      client = null;
    }
    self.emit('destroy', _err, _cid);
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

  if (!client.connected) {
      this._pool.destroy(client);
  } else {
    // Always reset the DB to the default. This prevents issues
    // if a user used the select command to change the DB.
    if (client._db_selected !== self._redis_default_db) {
      client.select(self._redis_default_db);
    }
    this._pool.release(client);
  }
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
