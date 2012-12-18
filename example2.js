/* This example uses the Pool.AcquireHelper function to
 * acquire a client connection. */

// You can customize the connection settings like this.
settings = {
	redis_port: 6379,
  redis_host: '127.0.0.1',
  redis_log_pool: false, // Turn on/off the generic-pool logging.
  redis_timeout: 2000,
  redis_min: 0
}
	
var Pool = require('./index');
	
function errorCallback(err) {
	console.log('Error: ', err);
}

function successCallback(client) {
  // Use the client here…
	client.ping(function(err, result) {
		console.log(err, result);
		
		// When done release the client.
	  Pool.release(client)
	})
}

Pool.AcquireHelper(errorCallback, successCallback);

// Stop the example after 10 seconds.
function stopExample() {
	Pool.Drain(Pool, function() {
		console.log('Pool drained, see ya.');
	});
}
setTimeout(stopExample, 10000);