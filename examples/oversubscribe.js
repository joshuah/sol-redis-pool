// You can startup Redis after this application starts and it should connect. :)
var RedisPool = require('../index');

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
    // Setting min > 0 will prevent this application from ending.
};

// Create the pool.
var pool = RedisPool(redisSettings, poolSettings);

// Get connection errors for logging...
pool.on('error', function(reason) {
  console.log('Connection Error:', reason);
});

// Over subscribe the pool.
for (var i = 0; i < 10; i++) {
  console.log('Requesting client #%s', i);
  pool.acquire(handleClient);
}

function handleClient(err, client) {
  console.log('Got a client, holding on to it for 2500ms.');

  setTimeout(function() {
    pool.release(client);
  }, 2500);
}