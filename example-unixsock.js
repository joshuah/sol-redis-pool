// Example 3: Using the acquireHelper with a unix socket.
// Our Settings
options = {
  unix_socket: '/tmp/redis.sock'
}
    
var RedisPool = require('sol-redis-pool');
var pool = new RedisPool(options);

// Handle the error here...
function errorCallback(err) {}

function clientCallback(client) {
  // Use the client then release it back to the pool.
  client.ping(function(err, result) {
	  console.log(err, result);
		// Release the client...
	  pool.release(client);
		// Drain the pool so the example will end.
		pool.drain(function(){
			console.log('Done...');
		});
  })
}
console.log("If everything is working, you should see 'null 'PONG'.")
pool.acquireHelper(errorCallback, clientCallback);
