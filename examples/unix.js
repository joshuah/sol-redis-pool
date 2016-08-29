var util = require('util');
var RedisPool = require('../index');

var LOG_MESSAGE = 'Available: %s, Pool Size: %s';

var redisSettings = {
  // Use TCP connections for Redis clients.
  path: "/tmp/redis.sock",
  // Set a redis client option.
  enable_offline_queue: true,
  no_ready_check: true
};

var poolSettings = {
  // Set the max milliseconds a resource can go unused before it should be destroyed.
  idleTimeoutMillis: 5000,
  max: 5
    // Setting min > 0 will prevent this application from ending.
};

// Create the pool.
var pool = RedisPool(redisSettings, poolSettings);

// Get connection errors for logging...
pool.on('error', function(reason) {
  console.log('Connection Error:', reason);
});

pool.on('destroy', function() {
  console.log(util.format('Checking pool info after client destroyed: ' + LOG_MESSAGE, pool.availableObjectsCount(), pool.getPoolSize()));
});

pool.acquire(clientConnection);

function clientConnection(err, client) {
  console.log(err);
  // Issue the PING command.
  client.ping(getPingResponse);

  function getPingResponse(err, response) {
    console.log('getPingResponse', err, response);
    setTimeout(delayResponse, 2500);
  }

  function delayResponse() {
    // Release the client after 2500ms.
    pool.release(client);
  }
}

// Setup up a poller to see how many objects are in the pool. Close out when done.
var poller = setInterval(pollRedisPool, 500);

function pollRedisPool() {
  console.log(util.format(LOG_MESSAGE, pool.availableObjectsCount(), pool.getPoolSize()));
  if (pool.availableObjectsCount() === 0 && pool.getPoolSize() === 0) {
    clearInterval(poller);
    console.log('There are no more requests in this pool, the program should exit now...');
  }
}