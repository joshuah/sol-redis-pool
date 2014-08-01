==============
sol-redis-pool
==============

A simple Redis pool for node using generic-pool. There are two example included. See example1.js for a demo.

### Install

    npm install sol-redis-pool

## 0.2.X Release Warning

The 0.2.X release was a complete rewrite of the module into an EventEmitter. The **acquireHelper()** method was removed and new features were added. You now have more control over how the Redis clients and the connection pooling operate. 

## Constructor:  RedisPool(redis_settings, pool_settings)
Create a new Redis connection pool.

```
    // Configure the Redis client connection settings.
    var redisSettings = {
        host: "127.0.0.1",
        port: 6379,
        auth_pass: "dingbats"
    };
    
    // Configure the generic-pool settings.
    var poolSettings = {
        max: 10,
        min: 2
    };
    
    var myPool = RedisPool(redisSettings, poolSettings);

```

## Redis Client Settings.

### Redis Connections Using TCP
```
                  host : the hostname or IP address of the Redis server.
                  port : the TCP port number for the Redis server.
```
### Redis Connections Using Unix Sockets
```
           unix_socket : the path to the Redis server Unix socket. e.g. /tmp/redis.sock
```

### Authentication
```
             auth_pass : If set, the client will run redis auth command on connect. The module will detect
                         this value and register the password with the client auth() method for you. 
```

### Additional **node_redis** Settings.
When you acquire a new client these options can be passed to the Redis client. See https://github.com/mranney/node_redis/blob/master/README.md for more details.

```
                parser : which Redis protocol reply parser to use.  Defaults to `hiredis` if that module is
                         installed. This may also be set to `javascript`.
        return_buffers : defaults to `false`.  If set to `true`, then all replies will be sent to callbacks
                         as node Buffer objects instead of JavaScript Strings.
        detect_buffers : default to `false`. If set to `true`, then replies will be sent to callbacks as node
                         Buffer objects if any of the input arguments to the original command were Buffer
                         objects. This option lets you switch between Buffers and Strings on a per-command basis, whereas `return_buffers` applies to every command on a client.
        socket_nodelay : defaults to `true`. Whether to call setNoDelay() on the TCP stream, which disables the
                         Nagle algorithm on the underlying socket.  Setting this option to `false` can result in additional throughput at the cost of more latency.  Most applications will want this set to `true`.
      socket_keepalive : defaults to `true`. Whether the keep-alive functionality is enabled on the underlying
                         socket. 
        no_ready_check : defaults to `false`. When a connection is established to the Redis server, the 
                         server might still be loading the database from disk.  While loading, the server not respond to any commands.  To work around this, `node_redis` has a "ready check" which sends the `INFO` command to the server.  The response from the `INFO` command indicates whether the server is ready for more commands.  When ready, `node_redis` emits a `ready`event. Setting `no_ready_check` to `true` will inhibit this check.
  enable_offline_queue : defaults to `true`. By default, if there is no active connection to the 
                         redis server, commands are added to a queue and are executed once the connection has been established. Setting `enable_offline_queue` to `false` will disable this feature and the callback will be execute immediately with an error, or an error will be thrown if no callback is specified.
       retry_max_delay : defaults to `null`. By default every time the client tries to connect and 
                         fails time  before reconnection (delay) almost doubles. This delay normally grows  infinitely, but setting `retry_max_delay` limits delay to maximum value, provided in milliseconds.
       connect_timeout : defaults to `false`. By default client will try reconnecting until connected. 
                         Setting `connect_timeout` limits total time for client to reconnect. Value is provided in milliseconds and is counted once the disconnect occured.
          max_attempts : defaults to `null`. By default client will try reconnecting until connected.
                         Setting `max_attempts` limits total amount of reconnects.
                family : defaults to `IPv4`. The client connects in IPv4 if not specified or if the DNS
                         solution returns an  IPv4 address. 
```

## Generic Pool Settings
Supported **generic-pool** settings. See https://github.com/coopernurse/node-pool/blob/master/README.md for more information.
```
                  name : name of pool (string, optional)
                   max : maximum number of resources to create at any given time
                         optional (default=1)
                   min : minimum number of resources to keep in pool at any given time
                         if this is set > max, the pool will silently set the min
                         to factory.max - 1
                         optional (default=0)
           refreshIdle : boolean that specifies whether idle resources at or below the min threshold
                         should be destroyed/re-created.  optional (default=true)
     idleTimeoutMillis : max milliseconds a resource can go unused before it should be destroyed
                         (default 30000)
    reapIntervalMillis : frequency to check for idle resources (default 1000),
          returnToHead : boolean, if true the most recently released resources will be the first to be allocated.
                         This in effect turns the pool's behaviour from a queue into a stack. optional (default false)
         priorityRange : int between 1 and x - if set, borrowers can specify their
                         relative priority in the queue if no resources are available.
                         see example.  (default 1)
```

## Methods

### acquire(callback, [priority])
Acquires a redis client from the pool. The callback is passed an **err** and **client**. The **client** object is a normal redis client. Make sure you release the **client** using the .release(client) method when you are done.

The pool now supports optional priority queueing. This becomes relevant when no resources are available and the caller has to wait. acquire() accepts an optional priority int which specifies the caller's relative position in the queue. This requires setting the pool option  *priorityRange*. See https://github.com/coopernurse/node-pool/blob/master/README.md for more information.

### release(client)
This method will release your client object back into the pool. Use this method when you no longer need the client.

### drain(callback)
This method will drain the connection pool completely and execute the callback when finished. You should call this when you want to close your application. If you do not your application will continue to run forever.

### getName()
Returns the factory.name for this pool.

### getPoolSize()
Returns number of resources in the pool regardless of whether they are free or in use.

### availableObjectsCount()
Returns number of unused resources in the pool.

### waitingClientsCount()
Returns number of callers waiting to acquire a resource.

## Events
Additional events will be added. 

### "error"
This event is emitted when a Redis client emits an "error", connection error event. You still need to pay attention to the **err** passed to your callback when you issue an acquire.

### "destroy"
This event is emitted when a Redis client is closed by the connection pool. This is a good location to inspect your RedisPool stats using the `availableObjectsCount()` and `waitingClientsCount()` methods.

## Examples
Examples are located in the examples/ folder in the repository. These examples will automatically close when done. If you change the *min* option for the pool the application will stay running forever.

* authentication.js - shows an example using a redis password. 
* oversubscribe.js  - shows what happens when you request more clients than you have in your pool.
* ping-example.js   - a simple example that issues a Redis PING command.

## History
0.2.0 - July 31 2014
- A complete rewrite of the module with breaking changes.
- Supports additional **node_redis** options. 
- Supports additional **generic-pool** options.
- The pool now supports optional priority queueing. This becomes relevant when no resources are available and the caller has to wait.
- Redis client client error events are now emitted from the Pool. This allows the connection pool to auto reconnect to the redis database properly.

0.1.4 - July 28 2014
- Pinned generic-pool version 2.1.0 in package.json. Thanks to David Aebersold for tagging pull request.

0.1.3 - September 16 2013
- Fixed a bug in how authentication is handled. Updated the documentation to reflect changes.

0.1.2 - March 03 2013
- Added Unix socket support by setting the unix_socket option.
