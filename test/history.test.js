import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createHistoryRouters } from '../src/routes/history.route.js';

process.env.JWT_SECRET = 'history-tests-only';
const { authMiddleware, requireRole } = await import('../src/middleware/auth.js');

async function setup(t, roles) {
  const calls = [];
  const db = {
    stock_movement: {
      findMany: async args => { calls.push(['stock', args]); return [{ id: 27, qty_change: '-2', balance_qty: '8' }]; },
      count: async () => 27,
    },
    audit_log: {
      findMany: async args => { calls.push(['audit', args]); return [{ id: 1, diff: { old: { password_hash: 'hidden' }, new: { name: 'สินค้า' } } }]; },
      count: async () => 1,
    },
  };
  const { stockMovementRouter, auditLogRouter } = createHistoryRouters(db);
  const app = express();
  app.use('/api', authMiddleware);
  app.use('/api/stock-movements', requireRole('PURCHASING', 'ACCOUNTING'), stockMovementRouter);
  app.use('/api/audit-logs', requireRole('ADMIN'), auditLogRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const token = roles ? jwt.sign({ id: 3, username: 'test', roles }, process.env.JWT_SECRET) : null;
  return {
    calls,
    get: path => fetch(`http://127.0.0.1:${server.address().port}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  };
}

for (const roles of [null, ['SALES'], []]) {
  test(`history endpoints deny ${JSON.stringify(roles)} before database reads`, async t => {
    const { get, calls } = await setup(t, roles);
    for (const endpoint of ['stock-movements', 'audit-logs']) assert.equal((await get(`/api/${endpoint}`)).status, roles ? 403 : 401);
    assert.equal(calls.length, 0);
  });
}
for (const role of ['ADMIN', 'PURCHASING', 'ACCOUNTING']) {
  test(`${role} can read stored stock movements without recalculation`, async t => {
    const { get, calls } = await setup(t, [role]);
    const response = await get('/api/stock-movements?page=2&limit=10&product_id=4&search=GR-01');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual({ total: body.total, page: body.page, limit: body.limit }, { total: 27, page: 2, limit: 10 });
    assert.equal(body.items[0].balance_qty, '8');
    assert.equal(calls[0][1].skip, 10);
    assert.equal(calls[0][1].take, 10);
    assert.equal(calls[0][1].where.product_id, 4);
    assert.ok(calls[0][1].where.OR);
    if (role !== 'ADMIN') assert.equal((await get('/api/audit-logs')).status, 403);
  });
}
test('audit records are admin-only, paginated and redact legacy secrets', async t => {
  const { get, calls } = await setup(t, ['ADMIN']);
  const response = await get('/api/audit-logs?entity=quotation&action=APPROVE&user_id=3');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.items[0].diff.old.password_hash, '[REDACTED]');
  assert.equal(data.items[0].diff.new.name, 'สินค้า');
  assert.equal(calls[0][1].where.user_id, 3);
  assert.equal(calls[0][1].where.action, 'APPROVE');
  assert.equal(calls[0][1].take, 50);
});
test('invalid and oversized filters return 400 without database reads', async t => {
  const { get, calls } = await setup(t, ['ADMIN']);
  for (const query of ['page=0', 'limit=101', 'limit=1.5', 'product_id=-1', 'page=Infinity', 'search=a&search=b', `search=${'x'.repeat(101)}`, 'unknown=1']) {
    assert.equal((await get(`/api/stock-movements?${query}`)).status, 400, query);
  }
  assert.equal(calls.length, 0);
});
