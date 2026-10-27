import { isIP } from 'node:net';

const entities = {
  units: 'unit', customers: 'customer', suppliers: 'supplier', products: 'product',
  accounts: 'account', categories: 'product_category', users: 'app_user',
  'goods-receipts': 'goods_receipt', bills: 'supplier_bill', payments: 'payment',
  shipments: 'shipment', 'purchase-requisitions': 'purchase_requisition',
  'purchase-orders': 'purchase_order', quotations: 'quotation',
  'sales-orders': 'sales_order', invoices: 'invoice', receipts: 'receipt',
};
const commands = new Set(['submit', 'approve', 'post', 'cancel', 'void']);
const sensitiveKey = /password|token|secret|authorization|cookie|api.?key/i;

export function sanitizeAuditData(value, depth = 0) {
  if (value == null) return null;
  if (depth >= 8) return '[TRUNCATED]';
  if (typeof value === 'string') return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitizeAuditData(item, depth + 1));
  if (typeof value === 'object') return Object.fromEntries(
    Object.entries(value).slice(0, 100).map(([key, item]) => [key, sensitiveKey.test(key) ? '[REDACTED]' : sanitizeAuditData(item, depth + 1)]),
  );
  return null;
}

export function createAuditMiddleware({ write, onError = (error, record) => console.error('Audit write failed', { code: error.code, entity: record.entity, entity_id: record.entity_id }) }) {
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const [rawResource, id, rawCommand] = req.path.split('/').filter(Boolean);
    const resource = rawResource?.toLowerCase();
    const command = rawCommand?.toLowerCase();
    const entity = entities[resource];
    if (!entity || !req.user?.id) return next();
    const send = res.json.bind(res);
    let recorded = false;

    res.json = body => {
      if (recorded || res.statusCode < 200 || res.statusCode >= 300) return send(body);
      recorded = true;
      const entityId = body?.id ?? (/^[1-9]\d*$/.test(id ?? '') ? Number(id) : null);
      const action = commands.has(command) ? command.toUpperCase()
        : req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DEACTIVATE' : 'UPDATE';
      const result = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => key === 'id' || key === 'status' || key.endsWith('_no')));
      const record = {
        user_id: Number(req.user.id), action, entity,
        entity_id: Number.isSafeInteger(entityId) && entityId > 0 ? entityId : null,
        diff: { request: sanitizeAuditData(req.body), result: sanitizeAuditData(result) },
        ip_address: isIP(req.ip) ? req.ip : null,
      };
      // The business write has committed; audit failure must not make clients retry it.
      Promise.resolve().then(() => write(record)).catch(error => {
        try { onError(error, record); } catch { /* Preserve the original response even if logging fails. */ }
      }).then(() => send(body)).catch(next);
      return res;
    };
    next();
  };
}
