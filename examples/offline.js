var util = require('util');
var RedisPool = require('../index');
var readline = require('readline');

console.log("This example shows how the enable_offline_queue flag works. You will need to shutdown your redis instance.");

var redisSettings = {
  // Use TCP connections for Redis clients.
  host: '127.0.0.1',
  port: 6379,
  // Set a redis client option.
  enable_offline_queue: true,
  no_ready_check: true
};

var poolSettings = {
  // Set the max milliseconds a resource can go unused before it should be destroyed.
  idleTimeoutMillis: 5000,
  max: 5
};

// Create the pool.
var pool = RedisPool(redisSettings, poolSettings);

// Get connection errors for logging...
pool.on('error', function(reason) {
  console.log(" " + reason.code);
});

pool.on('destroy', function(err, cid) {
  console.log("  Pool client destroyed: ID=%s", cid);
});

pool.acquire(clientConnection);

function clientConnection(err, client) {
  console.log("clientConnection: ID=", client._sol_cid);

  function getPingResponse(err, response) {
    console.log('getPingResponse', err, response);
    pool.release(client);
  }

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Please stop your redis instance and press <enter>. ', (answer) => {

    rl.close();
    console.log("Sending a ping() command to the offline redis server.");
    client.ping(getPingResponse);
    console.log('   Queued... Ok, now please start the redis server.');
  });

}

// Setup up a poller to see how many objects are in the pool. Close out when done.
var poller = setInterval(pollRedisPool, 500);

function pollRedisPool() {
  if (pool.availableObjectsCount() === 0 && pool.getPoolSize() === 0) {
    clearInterval(poller);
    console.log('There are no more requests in this pool, the program should exit now...');
  }
}