var util = require('util');
var RedisPool = require('../index');

var LOG_MESSAGE = 'Available: %s, Pool Size: %s';

var redisSettings = {
  // Use TCP connections for Redis clients.
  host: '127.0.0.1',
  port: 6379,
  retry_unfulfilled_commands: true,
  retry_strategy: function (options) {
    if (options.times_connected > 10) {
      // Stop retrying afer 10 attempts.
      return undefined;
    }
    // Increase each reconnect delay by 150ms.
    return options.attempt * 150;
  }
};

var poolSettings = {
  // Set the max milliseconds a resource can go unused before it should be destroyed.
  idleTimeoutMillis: 10000,
  max: 5
    // Setting min > 0 will prevent this application from ending.
};

// Create the pool.
var pool = RedisPool(redisSettings, poolSettings);

// Get connection errors for logging...
pool.on('error', function(reason) {
  console.log('Example Connection Error:', reason);
});

pool.on('destroy', function() {
  console.log(util.format('Checking pool info after client destroyed: ' + LOG_MESSAGE, pool.availableObjectsCount(), pool.getPoolSize()));
});

var maxPings = 10;
var pings = 0;

pool.acquire(clientConnection);

function clientConnection(err, client) {
  console.log(err);

  function getPingResponse(err, response) {
    console.log('getPingResponse', err, response);
    setTimeout(delayResponse, 2500);
  }

  function delayResponse() {
    // Release the client after 2500ms.
    pings = pings + 1;
    if(pings > maxPings) {
      pool.release(client);
    } else {
      client.ping(getPingResponse);
    }
  }
  delayResponse();

}

// Setup up a poller to see how many objects are in the pool. Close out when done.
var poller = setInterval(pollRedisPool, 500);

function pollRedisPool() {
  if (pool.availableObjectsCount() === 0 && pool.getPoolSize() === 0) {
    clearInterval(poller);
    console.log('There are no more requests in this pool, the program should exit now...');
  }
}