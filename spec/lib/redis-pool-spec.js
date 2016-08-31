var config = require('../config.json');
var RedisPool = require('../../index');

var redisPool;

beforeAll(function() {
  redisPool = new RedisPool(config.redis, config.pool);
});

describe('defaults', function() {
  beforeAll(function() {
    redisPool = new RedisPool({}, {});
  });

  it('should default the db to 0', function(done) {
    expect(redisPool._redis_default_db).toBe(0);
    done();
  });
});

describe('initialize', function() {
  it('should initialize the module', function(done) {
    expect(redisPool).not.toBe(null);
    done();
  });

  it('should initialize the module with a given db', function(done) {
    expect(redisPool).not.toBe(null);
    done();
  });

  it('should initialize the module with a redis socket connection', function(done) {
    redisPool = new RedisPool(config.unixsocket, {});
    expect(redisPool).not.toBe(null);
    done();
  });
});

describe('acquire', function() {
  it('should acquire a database connection', function(done) {
    redisPool.acquire(function(err, conn) {
      expect(err).toBe(null);
      expect(conn).not.toBe(null);
      redisPool.release(conn);
      done();
    });
  });

  it('should acquire a database connection with a priority', function(done) {
    redisPool.acquire(function(err, conn) {
      expect(err).toBe(null);
      expect(conn).not.toBe(null);
      redisPool.release(conn);
      done();
    }, 0);
  });
});

describe('acquireDb', function() {
  it('should acquire a given database connection', function(done) {
    redisPool.acquireDb(function(err, conn) {
      expect(err).toBe(null);
      expect(conn).not.toBe(null);
      redisPool.release(conn);
      done();
    }, 1);
  });
});

describe('drain', function() {
  it('should drains the connection pool and call the callback', function(done) {
    redisPool.drain(done);
  });
});

describe('getName', function() {
  it('should returns factory.name for this pool', function(done) {
    expect(redisPool.getName()).not.toBe(null);
    done();
  });
});

describe('getPoolSize', function() {
  it('should returns number of resources in the pool', function(done) {
    expect(redisPool.getPoolSize()).not.toBe(null);
    done();
  });
});

describe('availableObjectsCount', function() {
  it('should returns number of unused resources in the pool', function(done) {
    expect(redisPool.availableObjectsCount()).not.toBe(null);
    done();
  });
});

describe('waitingClientsCount', function() {
  it('should returns number of callers waiting to acquire a resource', function(done) {
    expect(redisPool.waitingClientsCount()).not.toBe(null);
    done();
  });
});

// Testing for errors.
var redisPoolError;
describe('redisErrorEvent', function(){

  it('should emit an error', function(done) {
      redisPoolError = new RedisPool(config.badredis, config.pool); 
      redisPoolError.on('error', function(err) {
        expect(err).not.toBe(null);
        expect(err.code).toBe("NR_CLOSED");
        done();
     });
     redisPoolError.acquire(function(err, conn) {
        // Send a command that should fail with AbortError.
        conn.set('_solredis', 5);
        redisPoolError.release(conn);
     });
   });
   it('should emit an error when the pool is destroyed', function(done) {
     redisPoolError.on('destroy', function(err, cid) {
        expect(cid).not.toBe(null);
        done();
     });
     redisPoolError.acquire(function(err, conn) {
       redisPoolError._pool.destroy(conn);
     });
     
   });
});
