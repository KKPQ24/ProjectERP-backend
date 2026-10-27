import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAuditMiddleware, sanitizeAuditData } from '../src/middleware/audit.js';

async function setup(t, write) {
  const records = [];
  const failures = [];
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.user = { id: 3 }; next(); });
  app.use('/api', createAuditMiddleware({ write: async record => { records.push(record); if (write) await write(record); }, onError: err => failures.push(err.message) }));
  app.post('/api/products', (req, res) => res.status(201).json({ id: 7, name: 'สินค้า' }));
  app.post('/api/quotations/:id/approve', (req, res) => res.json({ id: Number(req.params.id), status: 'approved' }));
  app.put('/api/users/:id', (req, res) => res.json({ id: Number(req.params.id), password_hash: 'must-not-store' }));
  app.delete('/api/products/:id', (req, res) => res.json({ id: Number(req.params.id), is_active: false }));
  app.post('/api/sales-orders', (req, res) => res.status(400).json({ message: 'invalid document' }));
  app.get('/api/products', (req, res) => res.json([]));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const request = (path, method, body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { records, failures, request };
}
test('successful writes are logged once, with authenticated actor and no secrets', async t => {
  const { records, request } = await setup(t);
  assert.equal((await request('/api/products', 'POST', { name: 'สินค้า', created_by: 999 })).status, 201);
  assert.equal(records.length, 1);
  assert.equal(records[0].user_id, 3);
  assert.equal(records[0].entity, 'product');
  assert.equal(records[0].entity_id, 7);
  assert.equal(records[0].action, 'CREATE');
  assert.equal((await request('/api/quotations/12/approve', 'POST')).status, 200);
  assert.equal(records[1].action, 'APPROVE');
  assert.equal(records[1].entity_id, 12);
  await request('/api/users/8', 'PUT', { password: 'secret', nested: { access_token: 'token', name: 'A' } });
  const serialized = JSON.stringify(records[2]);
  assert.equal(serialized.includes('must-not-store'), false);
  assert.equal(serialized.includes('"secret"'), false);
  assert.equal(serialized.includes('"token"'), false);
  assert.equal(records[2].diff.request.nested.name, 'A');
  await request('/api/products/7', 'DELETE');
  assert.equal(records[3].action, 'DEACTIVATE');
});
test('read requests, failed writes and unmatched routes are not audited', async t => {
  const { records, request } = await setup(t);
  await request('/api/products', 'GET');
  await request('/api/sales-orders', 'POST', {});
  await request('/api/missing', 'POST', {});
  assert.equal(records.length, 0);
});
test('audit failure does not misreport a committed operation as a failed write', async t => {
  const { records, failures, request } = await setup(t, async () => { throw new Error('audit unavailable'); });
  const response = await request('/api/products', 'POST', { name: 'สินค้า' });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).id, 7);
  assert.equal(records.length, 1);
  assert.deepEqual(failures, ['audit unavailable']);
});
test('sanitizing is non-mutating, bounded and handles null', () => {
  const original = { password_hash: 'original', items: Array(500).fill('value'), note: 'x'.repeat(10000) };
  const clean = sanitizeAuditData(original);
  assert.equal(original.password_hash, 'original');
  assert.equal(clean.password_hash, '[REDACTED]');
  assert.ok(clean.items.length <= 101);
  assert.ok(clean.note.length < 3000);
  assert.equal(sanitizeAuditData(null), null);
});

test('case-insensitive Express routes cannot bypass auditing', async t => {
  const { records, request } = await setup(t);
  assert.equal((await request('/api/PRODUCTS', 'POST', { name: 'สินค้า' })).status, 201);
  assert.equal(records[0]?.action, 'CREATE');
  assert.equal(records[0]?.entity, 'product');
  assert.equal((await request('/api/QUOTATIONS/12/APPROVE', 'POST')).status, 200);
  assert.equal(records[1]?.action, 'APPROVE');
});
