const test = require('node:test');
const assert = require('node:assert');
const sum = require('../src/utils/sum');

test('adds numbers', () => {
  assert.strictEqual(sum(1, 2), 3);
});
