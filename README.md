sol-redis-pool
==============

A simple Redis pool for node using generic-pool. There are two example included. See example1.js for a demo.

### Install

    npm install sol-redis-pool
    
### Example

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

The output should be:

    If everything is working you should see 'null 'PONG'.
    null 'PONG'

## Methods

### acquire(callback)
Acquires a redis client from the pool. The callback is passed an **err** and **client**. The **client** object is a normal redis client. Make sure you release the **client** using the .release(client) method when you are done.

### release(client)
This method will release your client object back into the pool.

### acquireHelper(errorCallback, clientCallback)
This method accepts two callbacks. The error callback is called if the pool
cannot return a client. `errorCallback(err)`. The clientCallback(client) returns the redis client connection. Note: You still need to **release** the client object.

### Drain(Pool, callback)
This method will drain the connection pool completely and execute the callback when finished. You should call this when you want to close your application. If you do not your application will continue to run forever.

The Pool argument should be your *Pool* object.

## Adjusting Pool Settings.
Combine any the settings you may need into one global named settings.

    options = {
      redis_host: '127.0.0.1',
      redis_port: 6379,
      redis_options: {},
      password: 'dingbats'
      max_clients: 10,
      min_clients: 2,
      reapIntervalMillis: 5000,
      idleTimeoutMillis: 30000,
      logging: true
    }

## Redis Options
 
### Redis Server and Port

    options = {
      redis_port: 6379,
      redis_host: '127.0.0.1'
    }

The default settings are port `6379` and `127.0.0.1`.

### Redis Server using a Unix Socket
    options = {
      unix_socket: '/tmp/redis.sock'
    }

### Additional Redis Options
You can pass any *options* you normally would pass to the **redis.createClient()** function in `node-redis`. See the [node-redis documentation](https://github.com/mranney/node_redis#rediscreateclientport-host-options) for more information.

    options = {
       redis_options: redisoptions…
    }

### Authentication 
Right now you have several options when authenticating. The example is how you should authenticate going forward. I will remove support for
setting `options.password`, `options.redis_password` and `options.auth_pass` at the 0.2 release.

    options = {
        redis_options: {auth_pass: 'dingbats'}
    }

## Generic Pool Options
These options are used to control the **generic-pool**. You will normally not need to use any of these options.

### Number of Clients
Optional minimum and maximum clients to have ready in the pool. The default values are 10 for the maximum and 2 for the minimum.

    options = {
       max_clients: 10,
       min_clients: 5
    }


### Generic Pool - Timeouts
You can adjust the **generic-pool** *reapIntervalMillis* and *idleTimeoutMillis*.

    options = {
       reapIntervalMillis: 5000,
       idleTimeoutMillis: 30000
    }


### Logging
If you would like to see what the *generic-pool* module is doing your can enable console logging by setting *logging* to `true`. This feature is off by default.

    options = {
      logging: true
    }

## Changes
* 2013-09-16 [0.1.3] - Fixed a bug in how authentication is handled. Updated the documentation to reflect changes.
* 2013-03-06 - Added Unix socket support by setting the `unix_socket` option. 