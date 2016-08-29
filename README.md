==============
sol-redis-pool
==============

A simple Redis pool for node using generic-pool.

### Install

    npm install sol-redis-pool

## Caveats
Pull requests welcome...

- When the **select** command is used after a client is acquired, the release method will not reset the client back to its origin state. You should either request the db with the **aquireDb** method or make sure you issue a **select** command before releasing the client back to the pool. 

## Constructor:  RedisPool(redis_settings, pool_settings)
Create a new Redis connection pool.

```
    // Configure the Redis client connection settings.
    var redisSettings = {
        host: "127.0.0.1",
        port: 6379,
        password: "dingbats",
        db: 3 // Set the default DB number.
    };
    
    // Configure the generic-pool settings.
    var poolSettings = {
        max: 10,
        min: 2
    };
    
    var myPool = RedisPool(redisSettings, poolSettings);

```

## Redis Client Settings.

### Redis Connection Options

| Property  | Default   | Description |
|-----------|-----------|-------------|
| host      | 127.0.0.1 | IP address of the Redis server |
| port      | 6379      | TCP Port of the Redis server |
| path      | null      | The UNIX socket string of the Redis server.  e.g. `/tmp/redis.sock`. |
| url       | null      | The URL of the Redis server. Format: `[redis:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]` (More info avaliable at [IANA](http://www.iana.org/assignments/uri-schemes/prov/redis)). |
| password | null | If set, client will run Redis auth command on connect. |
| auth_pass |**Deprecated** |  *Please use the `password` option instead.* |
| unix_socket | **Deprecated** | *Please use the `path` option instead.* |

### Authentication
The `auth_pass` option is deprecated. Please use the `password` option instead.
| Property  | Description |
|-----------|-----------|
| password | If set, the client will run redis auth command on connect. |


### Additional **node_redis** Settings.
When you acquire a new client these options can be passed to the Redis client. See https://github.com/NodeRedis/node_redis/blob/master/README.md for more details.

| Property  | Default   | Description |
|-----------|-----------|-------------|
| string_numbers | null | Set to `true`, `node_redis` will return Redis number values as Strings instead of javascript Numbers. Useful if you need to handle big numbers (above `Number.MAX_SAFE_INTEGER === 2^53`). Hiredis is incapable of this behavior, so setting this option to `true` will result in the built-in javascript parser being used no matter the value of the `parser` option. |
| return_buffers | false | If set to `true`, then all replies will be sent to callbacks as Buffers instead of Strings. |
| detect_buffers | false | If set to `true`, then replies will be sent to callbacks as Buffers. This option lets you switch between Buffers and Strings on a per-command basis, whereas `return_buffers` applies to every command on a client. __Note__: This doesn't work properly with the pubsub mode. A subscriber has to either always return Strings or Buffers. |
| socket_keepalive | true | If set to `true`, the keep-alive functionality is enabled on the underlying socket. |
| no_ready_check | false |  When a connection is established to the Redis server, the server might still be loading the database from disk. While loading, the server will not respond to any commands. To work around this, `node_redis` has a "ready check" which sends the `INFO` command to the server. The response from the `INFO` command indicates whether the server is ready for more commands. When ready, `node_redis` emits a `ready` event. Setting `no_ready_check` to `true` will inhibit this check. |
| enable_offline_queue |  true | By default, if there is no active connection to the Redis server, commands are added to a queue and are executed once the connection has been established. Setting `enable_offline_queue` to `false` will disable this feature and the callback will be executed immediately with an error, or an error will be emitted if no callback is specified. |
| retry_unfulfilled_commands | false | If set to `true`, all commands that were unfulfilled while the connection is lost will be retried after the connection has been reestablished. Use this with caution if you use state altering commands (e.g. `incr`). This is especially useful if you use blocking commands. |
| db | null | If set, client will run Redis `select` command on connect. |
| family | IPv4 | You can force using IPv6 if you set the family to 'IPv6'. See Node.js [net](https://nodejs.org/api/net.html) or [dns](https://nodejs.org/api/dns.html) modules on how to use the family type. |
| disable_resubscribing | false | If set to `true`, a client won't resubscribe after disconnecting. |
| rename_commands | null | Passing an object with renamed commands to use instead of the original functions. See the [Redis security topics](http://redis.io/topics/security) for more info. |
| retry_strategy | function | A function that receives an options object as parameter including the retry `attempt`, the `total_retry_time` indicating how much time passed since the last time connected, the `error` why the connection was lost and the number of `times_connected` in total. If you return a number from this function, the retry will happen exactly after that time in milliseconds. If you return a non-number, no further retry will happen and all offline commands are flushed with errors. Return an error to return that specific error to all offline commands. Example below. |

### Retry Example

```js
    retry_strategy: function (options) {
        if (options.times_connected > 10) {
            // Stop retrying afer 10 attempts.
            return undefined;
        }
        // Increase reconnect delay by 150ms.
        return options.attempt * 150;
    }
```

**Example Options on First attempt:**
```js
{ attempt: 1,
  error: null,
  total_retry_time: 0,
  times_connected: 1 }
```
  
**Example Options on Second Attempt:**
 ```js
 { attempt: 2,
  error: 
   { [Error: Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED 127.0.0.1:6379]
     code: 'ECONNREFUSED',
     errno: 'ECONNREFUSED',
     syscall: 'connect',
     address: '127.0.0.1',
     port: 6379 },
  total_retry_time: 1000,
  times_connected: 1 }
```

## Generic Pool Settings
Supported **generic-pool** settings. See https://github.com/coopernurse/node-pool/blob/master/README.md for more information.

| Property  | Default   | Description |
|-----------|-----------|-------------|
| name | optional | Name of the pool. |
| max | 1 | Maximum number of resources to create at a given time. |
| min | 0 | Minimum number of resources to keep in pool at any given time if this is set > max, the pool will silently set the min to factory.max - 1 |
| refreshIdle | true | Boolean that specifies whether idle resources at or below the min threshold should be destroyed/re-created. (Optional) |
| idleTimeoutMillis | 30000 | Max milliseconds a resource can go unused before it should be destroyed. |
| reapIntervalMillis | 1000 | Frequency to check for idle resources. |
|returnToHead | false | Boolean, if true the most recently released resources will be the first to be allocated. This in effect turns the pool's behaviour from a queue into a stack. |
| priorityRange | 1 | Int between 1 and x - if set, borrowers can specify their relative priority in the queue if no resources are available. |

## Methods

### acquire(callback, [priority])
Acquires a redis client from the pool. The callback is passed an **err** and **client**. The **client** object is a normal redis client. Make sure you release the **client** using the .release(client) method when you are done.

The pool now supports optional priority queueing. This becomes relevant when no resources are available and the caller has to wait. acquire() accepts an optional priority int which specifies the caller's relative position in the queue. This requires setting the pool option  *priorityRange*. See https://github.com/coopernurse/node-pool/blob/master/README.md for more information.

### acquireDb(callback, db, [priority])
Same as the aquire method but allows you to select a DB.

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

### "reconnecting"
The pool will emit reconnecting when trying to reconnect to the Redis server after losing the connection. Listeners are passed an object containing **delay** (in ms) and **attempt** (the attempt #) attributes.

### "destroy"
This event is emitted when a Redis client is closed by the connection pool. This is a good location to inspect your RedisPool stats using the `availableObjectsCount()` and `waitingClientsCount()` methods.

## Examples
Examples are located in the examples/ folder in the repository. These examples will automatically close when done. If you change the *min* option for the pool the application will stay running forever.

* authentication.js - shows an example using a redis password. 
* oversubscribe.js  - shows what happens when you request more clients than you have in your pool.
* ping-example.js   - a simple example that issues a Redis PING command.

## History
0.3.0 - August 28 2016
- Client Connection Changes:
   * Replaced the `auth_pass` option with `password`.
   * Replaced the `unix_socket` option with `path`.
   * Added the `url` option for connections.
   * Fixed an issue with an extra `select` statement being sent on client connect when the `db` option is set. 
- Added support for the redis client `retry_strategy` option. 
- Removed deprecated options: 'parser', 'socket_nodelay', 'retry_max_delay', 'connect_timeout', 'max_attempts'
- Added options: 'string_numbers', 'retry_unfulfilled_commands', 'disable_resubscribing', 'rename_commands'
- Changed minimum redis client version to 2.6.2. 
- Added a reconnecting event. 

0.2.4 - March 19 2016
- Fixed warnings for issue #14.

0.2.3 - February 23 2016
- DB selection performance fix for issues #12 & #13. (PuKoren)
- Added caveat for users who are using the select command after they acquire a connection.

0.2.2 - November 16 2015
- Added jslint support (jkernech)
- Added unit tests and code coverage (jkernech)
- Updated generic-pool to version 2.2.1. 

0.2.1 - August 19 2015
- Added DB selection features. A default DB can be selected by adding "a {db: X} object to the redisOptions. There is also a new .aquireDb(callback, db, [priority]) function that can be used to select a DB wher aquiring an object from the pool. These changes introduce additional SELECT commands to your pooled connections.
- The release function automatically executes a select command before releasing the redis connection back to the pool. This prevents a connection to an unknown DB being released and then aquired.
- Added a new example script for database selection. See db-select.js...

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
