var config = require('../config.json');
var RedisPool = require('../../index');


var redisPool;

beforeAll(function() {
  redisPool = new RedisPool(config.redis, {
    max: 10,
    min: 2
  });
});
