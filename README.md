
sol-redis-pool
==============

A simple Redis pool for node using generic-pool.

### Install

    npm install sol-redis-pool

## Caveats
Pull requests welcome...

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
| tls | null | An object containing options to pass to tls.connect to set up a TLS connection to Redis (if, for example, it is set up to be accessible via a tunnel). |
| prefix | null | A string used to prefix all used keys (e.g. namespace:test). Please be aware that the keys command will not be prefixed. The keys command has a "pattern" as argument and no key and it would be impossible to determine the existing keys in Redis if this would be prefixed. |
| retry_strategy | function | A function that receives an options object as parameter including the retry `attempt`, the `total_retry_time` indicating how much time passed since the last time connected, the `error` why the connection was lost and the number of `times_connected` in total. If you return a number from this function, the retry will happen exactly after that time in milliseconds. If you return a non-number, no further retry will happen and all offline commands are flushed with errors. Return an error to return that specific error to all offline commands. Example below. |

## Retry Strategy
Note: The `error` value is set to null on the first failure.  

```js
// The first connection attempt.
{ attempt: 1,
  error: null,
  total_retry_time: 0,
  times_connected: 1 }
// The second attempt.
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

### A Simple Reconnect Strategy.

```js
    retry_strategy: function (options) {
        if (options.attempt > 10) {
            // Stop retrying afer 10 attempts.
            return undefined;
        }
        // Increase reconnect delay by 150ms.
        return options.attempt * 150;
    }
```

### No Reconnect Strategy
Use this strategy when you want to pool to not attempt reconnections.
```js
    retry_strategy: function (options) {
        return undefined;
    }
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
This event is emitted when a Redis client emits an "error", connection error event. You still need to pay attention to the **err** passed to your callback when you issue an acquire. The error object contains an attribute named `cid` for tracking which client connection had an error.

### "reconnecting"
The pool will emit reconnecting when trying to reconnect to the Redis server after losing the connection. Listeners are passed an object containing **delay** (in ms), **attempt** (the attempt #), and **cid** attributes.

### "destroy"
This event is emitted when a Redis client is closed by the connection pool. The event will pass an **error** and **cid** value. 

## Examples
Examples are located in the examples/ folder in the repository. These examples will automatically close when done. If you change the *min* option for the pool the application will stay running forever.

* authentication.js - shows an example using a redis password. 
* oversubscribe.js  - shows what happens when you request more clients than you have in your pool.
* ping-example.js   - a simple example that issues a Redis PING command.
* offline.js - shows how the `enable_offline_queue` option and recovery works.
* retry.js - shows a `retry_strategy` option in action.
* unix.js - shows a unix socket connection.

## History
0.3.3 - April 28 2017
- Added `prefix` option. #25

0.3.2 - October 23 2016
- Added bluebird promise support for underlying redis connections in the pool. #21
- Added the `tls` redis option. #22

0.3.1 - August 31 2016
- Prevent the `pool.release(client)` method from releasing a disconnected client back into the pool. Fixes issue #19. Some users may need to watch their pool **min** value.
- Added connection tracking to all clients int the pool. You may access the value using the `client._sol_cid` property. This value is passed to the `destroy`, `reconnecting`, and `error` events as well. This should help users with their application logging.
- Improved the `retry_strategy` examples in the README.md and fixed the retry.js example.
- Fixed some examples.
- Fixed a bug in the `reconnecting` event.
- Updated redis-pool-spec.js file.
- Moved older changes to CHANGES.md

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
