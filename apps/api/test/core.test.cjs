const test = require('node:test');
const assert = require('node:assert/strict');
const { allowedOrderActions } = require('../dist/common/helpers.js');

test('pending payment orders expose pay and cancel actions', () => {
  const actions = allowedOrderActions('PENDING_PAYMENT');
  assert.equal(actions.includes('PAY'), true);
  assert.equal(actions.includes('CANCEL'), true);
  assert.equal(actions.includes('CONFIRM_DELIVERED'), false);
  assert.equal(actions.includes('REVIEW'), false);
});

test('completed orders cannot mutate fulfillment state', () => {
  const actions = allowedOrderActions('COMPLETED');
  assert.equal(actions.includes('PAY'), false);
  assert.equal(actions.includes('CANCEL'), false);
  assert.equal(actions.includes('REVIEW'), true);
});
