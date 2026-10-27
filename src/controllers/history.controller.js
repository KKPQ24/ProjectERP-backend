import { sanitizeAuditData } from '../middleware/audit.js';

function badQuery() { return Object.assign(new Error('ตัวกรองหรือเลขหน้าไม่ถูกต้อง'), { status: 400 }); }
function positiveInteger(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) throw badQuery();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) throw badQuery();
  return number;
}
export function parseHistoryQuery(query, kind) {
  const integerFields = kind === 'stock' ? ['product_id'] : ['user_id'];
  const textFields = kind === 'stock' ? { ref_type: 30 } : { entity: 50, action: 20 };
  const allowed = new Set(['page', 'limit', 'search', ...integerFields, ...Object.keys(textFields)]);
  if (Object.keys(query).some(key => !allowed.has(key))) throw badQuery();
  const page = positiveInteger(query.page, 1, 10000);
  const limit = positiveInteger(query.limit, 50, 100);
  const where = {};
  for (const key of integerFields) if (query[key] !== undefined) where[key] = positiveInteger(query[key], undefined, 2147483647);
  for (const [key, max] of Object.entries(textFields)) {
    if (query[key] === undefined) continue;
    if (typeof query[key] !== 'string' || query[key].length > max) throw badQuery();
    if (query[key].trim()) where[key] = query[key].trim();
  }
  if (query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 100)) throw badQuery();
  return { page, limit, skip: (page - 1) * limit, search: query.search?.trim() ?? '', where };
}

const actor = { select: { id: true, username: true, full_name: true } };
const stockSelect = {
  id: true, product_id: true, moved_at: true, qty_change: true, unit_cost: true,
  value_change: true, balance_qty: true, balance_value: true,
  ref_type: true, ref_id: true, ref_no: true, note: true, created_by: true,
  product: { select: { id: true, sku: true, name: true, unit: { select: { code: true, name: true } } } },
  app_user: actor,
};
const auditSelect = {
  id: true, user_id: true, action: true, entity: true, entity_id: true,
  diff: true, ip_address: true, created_at: true, app_user: actor,
};

export function createHistoryController(db) {
  async function list(req, res, kind) {
    try {
      const { page, limit, skip, search, where } = parseHistoryQuery(req.query, kind);
      const contains = { contains: search, mode: 'insensitive' };
      if (search) where.OR = kind === 'stock'
        ? [{ ref_no: contains }, { product: { is: { OR: [{ sku: contains }, { name: contains }] } } }]
        : [{ entity: contains }, { action: contains }, { app_user: { is: { OR: [{ username: contains }, { full_name: contains }] } } }];
      const model = kind === 'stock' ? db.stock_movement : db.audit_log;
      const [items, total] = await Promise.all([
        model.findMany({ where, skip, take: limit, orderBy: { id: 'desc' }, select: kind === 'stock' ? stockSelect : auditSelect }),
        model.count({ where }),
      ]);
      res.json({ items: kind === 'stock' ? items : items.map(item => ({ ...item, diff: sanitizeAuditData(item.diff) })), total, page, limit });
    } catch (error) {
      res.status(error.status === 400 ? 400 : 500).json({ message: error.status === 400 ? error.message : 'ไม่สามารถโหลดประวัติได้' });
    }
  }
  return {
    stockMovements: (req, res) => list(req, res, 'stock'),
    auditLogs: (req, res) => list(req, res, 'audit'),
  };
}
