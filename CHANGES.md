0.3.1 - August 31 2016
- Prevent the `pool.release(client)` method from releasing a disconnected client back into the pool. Fixes issue #19. Some users may need to watch their pool **min** value.
- Added connection tracking to all clients int the pool. You may access the value using the `client._sol_cid` property. This value is passed to the `destroy`, `reconnecting`, and `error` events as well. This should help users with their application logging.
- Improved the `retry_strategy` examples in the README.md and fixed the retry.js example.
- Fixed some examples.
- Fixed a bug in the `reconnecting` event.
- Updated redis-pool-spec.js file.

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