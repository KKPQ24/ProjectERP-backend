import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHistoryQuery } from '../src/controllers/history.controller.js';
import { sanitizeAuditData } from '../src/middleware/audit.js';

const rejects = (query, kind = 'stock') => assert.throws(() => parseHistoryQuery(query, kind), error => error.status === 400);

test('unit: history defaults keep reads bounded', () => {
  assert.deepEqual(parseHistoryQuery({}, 'stock'), { page: 1, limit: 50, skip: 0, search: '', where: {} });
});
test('unit: pagination computes the correct offset at accepted boundaries', () => {
  assert.deepEqual(parseHistoryQuery({ page: '10000', limit: '100' }, 'stock'), { page: 10000, limit: 100, skip: 999900, search: '', where: {} });
  assert.equal(parseHistoryQuery({ page: '2', limit: '25' }, 'audit').skip, 25);
});
test('unit: stock filters retain typed product ID and literal search text', () => {
  const value = parseHistoryQuery({ product_id: '12', ref_type: ' shipment ', search: ' ปากกา %_ ' }, 'stock');
  assert.deepEqual(value.where, { product_id: 12, ref_type: 'shipment' });
  assert.equal(value.search, 'ปากกา %_');
});
test('unit: audit filters retain authenticated actor selector and action', () => {
  const value = parseHistoryQuery({ user_id: '3', action: ' APPROVE ', entity: ' quotation ' }, 'audit');
  assert.deepEqual(value.where, { user_id: 3, action: 'APPROVE', entity: 'quotation' });
});
test('unit: blank optional text filters do not restrict results', () => {
  assert.deepEqual(parseHistoryQuery({ search: ' ', ref_type: ' ' }, 'stock').where, {});
  assert.deepEqual(parseHistoryQuery({ action: '', entity: ' ' }, 'audit').where, {});
});
test('unit: zero, negative, fractional, scientific and unsafe integers are rejected', () => {
  for (const value of ['0', '-1', '1.5', '1e3', 'Infinity', 'NaN', '9007199254740992']) {
    rejects({ page: value });
    rejects({ product_id: value });
  }
  rejects({ page: '10001' });
  rejects({ limit: '101' });
  rejects({ user_id: '2147483648' }, 'audit');
});
test('unit: array/object filters cannot inject Prisma operators', () => {
  for (const value of [['1', '2'], { gt: 0 }, 1, true, null]) {
    rejects({ page: value });
    rejects({ search: value });
    rejects({ ref_type: value });
    rejects({ user_id: value }, 'audit');
  }
});
test('unit: endpoint-specific and unknown filter names are rejected', () => {
  rejects({ user_id: '3' });
  rejects({ product_id: '3' }, 'audit');
  rejects({ include: 'app_user' }, 'audit');
  rejects({ orderBy: 'id' });
});
test('unit: text size limits are enforced', () => {
  assert.equal(parseHistoryQuery({ search: 'x'.repeat(100) }, 'stock').search.length, 100);
  rejects({ search: 'x'.repeat(101) });
  rejects({ ref_type: 'x'.repeat(31) });
  rejects({ entity: 'x'.repeat(51) }, 'audit');
  rejects({ action: 'x'.repeat(21) }, 'audit');
});
test('unit: parsing never mutates caller filters', () => {
  const query = Object.freeze({ search: ' hello ', product_id: '7' });
  parseHistoryQuery(query, 'stock');
  assert.equal(query.search, ' hello ');
  assert.equal(query.product_id, '7');
});
test('unit: nested secrets are redacted regardless of key casing', () => {
  const input = { Password: 'pw', nested: { password_hash: 'hash', ACCESS_TOKEN: 'jwt', apiKey: 'key', Authorization: 'bearer', cookie: 'session', name: 'พนักงาน' } };
  const clean = sanitizeAuditData(input);
  assert.equal(clean.Password, '[REDACTED]');
  for (const field of ['password_hash', 'ACCESS_TOKEN', 'apiKey', 'Authorization', 'cookie']) assert.equal(clean.nested[field], '[REDACTED]');
  assert.equal(clean.nested.name, 'พนักงาน');
  assert.equal(input.nested.password_hash, 'hash');
});
test('unit: audit data preserves meaningful scalar values and arrays', () => {
  assert.deepEqual(sanitizeAuditData({ count: 0, enabled: false, note: '', missing: null, lines: [{ qty: 2 }] }), { count: 0, enabled: false, note: '', missing: null, lines: [{ qty: 2 }] });
  assert.deepEqual(sanitizeAuditData([NaN, Infinity, undefined]), [null, null, null]);
});
test('unit: large audit payloads are bounded', () => {
  const input = { note: 'x'.repeat(10000), lines: Array(1000).fill({ qty: 1 }) };
  const clean = sanitizeAuditData(input);
  assert.equal(clean.note.length, 2001);
  assert.equal(clean.lines.length, 100);
  assert.equal(input.lines.length, 1000);
});
test('unit: deep or circular audit data terminates safely', () => {
  const circular = { name: 'test' };
  circular.self = circular;
  const clean = sanitizeAuditData(circular);
  assert.ok(JSON.stringify(clean).includes('[TRUNCATED]'));
});
