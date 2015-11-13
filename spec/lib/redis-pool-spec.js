var config = require('../config.json');
var RedisPool = require('../../index');


var redisPool;

beforeAll(function() {
  redisPool = new RedisPool(config.redis, {
    max: 10,
    min: 2
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