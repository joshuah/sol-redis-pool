var util = require('util');
var RedisPool = require('../index');

var LOG_MESSAGE = 'Available: %s, Pool Size: %s';

var redisSettings = {
  // Use TCP connections for Redis clients.
  host: '127.0.0.1',
  port: 6379,
  // Set a redis client option.
  enable_offline_queue: true,
  no_ready_check: true,
  // New feature default DB selection.
  db: 0
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

// Select a non default DB number. Use the MONITOR command to watch.
pool.acquireDb(clientConnection, 5);

function clientConnection(err, client) {
  console.log(err);

  var TEST_KEY = '_DB_SELECT_TEST';
  var DB_NUM = 5;

  // Issue the PING command.
  client.set(TEST_KEY, DB_NUM, keyWritten);

  function keyWritten(err, response) {
    console.log('Key was written:', response);
    client.get(TEST_KEY, keyRead);
  }

  function keyRead(err, response) {
    console.log('Key was read:', response);
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