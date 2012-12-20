// Example 1: Using the acquireHelper.
// Our Settings
options = {
  redis_host: '127.0.0.1',
  redis_port: 6379,
}
    
var RedisPool = require('./index');
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
