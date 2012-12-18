/* This example uses the Pool.acquire function to
 * acquire a client connection. */

// You can customize the connection settings like this.
settings = {
	redis_port: 6379,
  redis_host: '127.0.0.1',
  redis_log_pool: false, // Turn on/off the generic-pool logging.
  redis_timeout: 2000,
  redis_min: 0
}
	
var Pool = require('./index'); //sol-redis-pool
	
function Example(err, client) {
	// Use redis client like you normally would.
	console.log("You should see: null 'PONG'");
	client.ping(function(err, result){
		console.log(err, result);
		// When you are done with the client release it like this.
	  Pool.release(client);
	});
}
	
Pool.acquire(Example); 

// Stop the example after 10 seconds.
function stopExample() {
	Pool.Drain(Pool, function() {
		console.log('Pool drained, see ya.');
	});
}
setTimeout(stopExample, 10000);

