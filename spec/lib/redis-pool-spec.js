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
