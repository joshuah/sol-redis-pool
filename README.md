sol-redis-pool
==============

A simple Redis pool for node using generic-pool. There are two example included.

### Install

    npm install sol-redis-pool
    
### Example

    // Configure our pool settings.
    settings = {
	  redis_port: 6379,
      redis_host: '127.0.0.1',
    }
    
    var Pool = require('sol-redis-pool');
    
    // Handle the error here...
    function errorCallback(err) {}

    function successCallback(client) {
      // Use the client then release it back to the pool.
      client.ping(function(err, result) {
	    console.log(err, result);
	    Pool.release(client);
      })
    }
    Pool.AcquireHelper(errorCallback, successCallback);

## Methods

### AcquireHelper(errorCallback, successCallback)
This method accepts two callbacks. The error callback is called if the pool
cannot return a client. `errorCallback(err)`. The successCallback(client) returns the redis client connection.

### Drain(Pool, callback)
This method will drain the connection pool completely and execute the callback when finished. You should call this when you want to close your application. If you do not your application will continue to run forever.

The Pool argument should be your *Pool* object.

## Adjusting Pool Settings.
Combine any the settings you may need into one global named settings.

    // Create a global named settings.
    settings = {
      redis_max: 10,
      redis_min: 5
    }
    
### Redis Server and Port

    settings = {
      redis_port: 6379,
      redis_host: '127.0.0.1'
    }

The default settings are port `6379` and `127.0.0.1`.

### Max Redis Clients
Sets maximum number of resources to create at any given time.

    settings = {
       redis_max: 10
    }
    
The default value is 10.

### Min Redis Clients
Sets minimum number of resources to keep in pool at any given time.

    settings = {
       redis_min: 5
    }


The default value is 2.

## Advanced Settings.

### Generic Pool - Timeouts
You can adjust the *reapIntervalMillis* by setting *redis_reap_timeout*. The *idleTimeoutMillis* can be set by setting *redis_timeout*.

    settings = {
       redis_reap_timeout: 5000,
       redis_timeout: 30000
    }


### Generic Pool Logging
If you would like to see what the *generic-pool* module is doing your can enable console logging by setting *redis_log_pool* to `true`. This feature is off by default.

    settings = {
      redis_log_pool: true
    }

