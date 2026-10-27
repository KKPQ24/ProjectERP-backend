// ตัวอย่าง request body ของแต่ละ endpoint — ให้ frontend เห็นชัดว่าต้องส่งฟิลด์อะไร
// key = "method /api/path"  (path ใช้ {id}) · ฟิลด์เลขเอกสาร (gr_no/po_no ฯลฯ) ระบบออกให้เอง ไม่ต้องส่ง
export const bodies = {
  // ---- Auth ----
  "post /api/auth/register": { username: "sale01", password: "12345678", full_name: "พนักงานขาย", email: "sale01@example.com" },
  "post /api/auth/login": { username: "admin", password: "admin1234" },

  // ---- Master data ----
  "post /api/units": { code: "PCS", name: "ชิ้น" },
  "put /api/units/{id}": { code: "PCS", name: "ชิ้น" },
  "post /api/customers": { code: "C-001", name: "บริษัท ตัวอย่าง จำกัด", tax_id: "0105500000000", address: "กรุงเทพฯ", phone: "021234567", email: "info@example.com", credit_days: 30 },
  "put /api/customers/{id}": { name: "บริษัท ตัวอย่าง จำกัด", phone: "021234567", credit_days: 30 },
  "post /api/suppliers": { code: "S-001", name: "ผู้ขายตัวอย่าง", tax_id: "0105500000000", address: "กรุงเทพฯ", phone: "021234567", email: "sale@sup.com", credit_days: 30 },
  "put /api/suppliers/{id}": { name: "ผู้ขายตัวอย่าง", phone: "021234567", credit_days: 30 },
  "post /api/products": { sku: "P-001", name: "ปากกาลูกลื่น", category_id: 1, unit_id: 1, sale_price: 15, reorder_point: 20 },
  "put /api/products/{id}": { name: "ปากกาลูกลื่น", sale_price: 15, reorder_point: 20 },
  "post /api/accounts": { code: "1010", name: "เงินสด/ธนาคาร", type: "asset", normal_balance: "D" },
  "put /api/accounts/{id}": { name: "เงินสด/ธนาคาร", is_active: true },
  "post /api/categories": { code: "WRITE", name: "เครื่องเขียน" },
  "put /api/categories/{id}": { code: "WRITE", name: "เครื่องเขียน" },
  "post /api/users": { username: "user01", password_hash: "hash-here", full_name: "ผู้ใช้", email: "u@example.com" },
  "put /api/users/{id}": { full_name: "ผู้ใช้", email: "u@example.com" },

  // ---- จัดซื้อ (Purchasing) ----
  "post /api/purchase-requisitions": { pr_date: "2026-08-31T00:00:00Z", note: "ขอซื้อของเข้าสต๊อก", created_by: 1, lines: [{ product_id: 1, qty: 100, note: "" }] },
  "put /api/purchase-requisitions/{id}": { pr_date: "2026-08-31T00:00:00Z", note: "ขอซื้อของเข้าสต๊อก", created_by: 1, lines: [{ product_id: 1, qty: 100, note: "" }] },
  "post /api/purchase-orders": { po_date: "2026-08-31T00:00:00Z", supplier_id: 1, pr_id: null, subtotal_amount: 800, vat_amount: 56, total_amount: 856, note: "", created_by: 1, lines: [{ product_id: 1, qty: 100, unit_price: 8, line_amount: 800 }] },
  "put /api/purchase-orders/{id}": { po_date: "2026-08-31T00:00:00Z", supplier_id: 1, subtotal_amount: 800, vat_amount: 56, total_amount: 856, note: "", created_by: 1, lines: [{ product_id: 1, qty: 100, unit_price: 8, line_amount: 800 }] },
  "post /api/goods-receipts": { gr_date: "2026-08-31T00:00:00Z", supplier_id: 1, po_id: null, note: "", created_by: 1, lines: [{ product_id: 1, qty: 100, unit_cost: 8 }] },
  "post /api/bills": { bill_date: "2026-08-31T00:00:00Z", supplier_ref: "INV-123", due_date: "2026-09-30T00:00:00Z", supplier_id: 1, po_id: null, gr_id: null, subtotal_amount: 800, vat_amount: 56, total_amount: 856, created_by: 1, lines: [{ product_id: 1, account_id: null, description: "", qty: 100, unit_price: 8, line_amount: 800 }] },
  "post /api/payments": { payment_date: "2026-08-31T00:00:00Z", supplier_id: 1, method: "transfer", cash_account_id: 1, amount: 856, note: "", created_by: 1, allocations: [{ bill_id: 1, amount: 856 }] },

  // ---- ขาย (Sales) ----
  "post /api/quotations": { qt_date: "2026-08-31T00:00:00Z", valid_until: "2026-09-30T00:00:00Z", customer_id: 1, subtotal_amount: 600, vat_amount: 42, total_amount: 642, note: "", created_by: 1, lines: [{ product_id: 1, qty: 30, unit_price: 20, line_amount: 600 }] },
  "put /api/quotations/{id}": { qt_date: "2026-08-31T00:00:00Z", customer_id: 1, subtotal_amount: 600, vat_amount: 42, total_amount: 642, note: "", created_by: 1, lines: [{ product_id: 1, qty: 30, unit_price: 20, line_amount: 600 }] },
  "post /api/sales-orders": { so_date: "2026-08-31T00:00:00Z", customer_id: 1, qt_id: null, subtotal_amount: 600, vat_amount: 42, total_amount: 642, note: "", created_by: 1, lines: [{ product_id: 1, qty: 30, unit_price: 20, line_amount: 600 }] },
  "put /api/sales-orders/{id}": { so_date: "2026-08-31T00:00:00Z", customer_id: 1, subtotal_amount: 600, vat_amount: 42, total_amount: 642, note: "", created_by: 1, lines: [{ product_id: 1, qty: 30, unit_price: 20, line_amount: 600 }] },
  "post /api/shipments": { sh_date: "2026-08-31T00:00:00Z", customer_id: 1, so_id: null, note: "", created_by: 1, lines: [{ product_id: 1, qty: 30 }] },
  "post /api/invoices": { inv_date: "2026-08-31T00:00:00Z", due_date: "2026-09-30T00:00:00Z", customer_id: 1, so_id: null, shipment_id: null, subtotal_amount: 600, vat_amount: 42, total_amount: 642, created_by: 1, lines: [{ product_id: 1, account_id: null, description: "", qty: 30, unit_price: 20, line_amount: 600 }] },
  "post /api/receipts": { receipt_date: "2026-08-31T00:00:00Z", customer_id: 1, method: "transfer", cash_account_id: 1, amount: 642, note: "", created_by: 1, allocations: [{ invoice_id: 1, amount: 642 }] },
};

// คำอธิบายสั้นๆ ต่อ endpoint (โชว์เป็นหัวข้อใน Swagger)
export const summaries = {
  "get /api/stock-movements": "ประวัติสต็อก (ADMIN, PURCHASING, ACCOUNTING)",
  "get /api/audit-logs": "ประวัติการใช้งาน (ADMIN)",
  "post /api/auth/register": "สมัครผู้ใช้ใหม่ (ระบบ hash รหัสผ่านให้)",
  "post /api/auth/login": "เข้าสู่ระบบ คืน token เอาไปกดปุ่ม Authorize",
  "get /api/auth/me": "ข้อมูลผู้ใช้ที่ล็อกอินอยู่",
  "get /api/products/low-stock": "สินค้าที่ของใกล้หมด (on_hand ไม่เกิน reorder_point)",
  "get /api/reports/trial-balance": "งบทดลอง รวมเดบิต/เครดิตทุกบัญชี",

  "post /api/goods-receipts/{id}/post": "รับของเข้า ตัดสต๊อกและลงบัญชี (ไม่ต้องมี body)",
  "post /api/bills/{id}/post": "ตั้งหนี้ ลงบัญชี Cr เจ้าหนี้ (ไม่ต้องมี body)",
  "post /api/payments/{id}/post": "จ่ายเงิน Dr เจ้าหนี้ Cr เงินสด (ไม่ต้องมี body)",
  "post /api/shipments/{id}/post": "ส่งของ ตัดสต๊อกออกและลงต้นทุนขาย (ไม่ต้องมี body)",
  "post /api/invoices/{id}/post": "ออกใบแจ้งหนี้ Dr ลูกหนี้ Cr รายได้ (ไม่ต้องมี body)",
  "post /api/receipts/{id}/post": "รับเงิน Dr เงินสด Cr ลูกหนี้ (ไม่ต้องมี body)",

  "post /api/purchase-requisitions/{id}/submit": "ส่งขออนุมัติ (draft เป็น pending)",
  "post /api/purchase-requisitions/{id}/approve": "อนุมัติ (pending เป็น approved)",
  "post /api/purchase-requisitions/{id}/cancel": "ยกเลิก",
  "post /api/purchase-orders/{id}/approve": "อนุมัติ PO (draft เป็น approved)",
  "post /api/purchase-orders/{id}/cancel": "ยกเลิก",
  "post /api/quotations/{id}/submit": "ส่งใบเสนอราคาให้ลูกค้า (draft เป็น pending)",
  "post /api/quotations/{id}/approve": "ลูกค้าตอบรับ (pending เป็น approved)",
  "post /api/quotations/{id}/cancel": "ยกเลิก",
  "post /api/sales-orders/{id}/approve": "อนุมัติ SO (draft เป็น approved)",
  "post /api/sales-orders/{id}/cancel": "ยกเลิก",

  "delete /api/customers/{id}": "ปิดการใช้งาน (soft delete ไม่ลบจริง)",
  "delete /api/suppliers/{id}": "ปิดการใช้งาน (soft delete)",
  "delete /api/products/{id}": "ปิดการใช้งาน (soft delete)",
  "delete /api/accounts/{id}": "ปิดการใช้งาน (soft delete)",
  "delete /api/users/{id}": "ปิดการใช้งาน (soft delete)",
};

// Query controls for the read-only history endpoints in Swagger.
const historyCommon = [
  { in: "query", name: "page", schema: { type: "integer", minimum: 1, maximum: 10000, default: 1 } },
  { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
  { in: "query", name: "search", schema: { type: "string", maxLength: 100 } },
];
export const queryParameters = {
  "get /api/stock-movements": [...historyCommon,
    { in: "query", name: "product_id", schema: { type: "integer", minimum: 1 } },
    { in: "query", name: "ref_type", schema: { type: "string", maxLength: 30 } },
  ],
  "get /api/audit-logs": [...historyCommon,
    { in: "query", name: "user_id", schema: { type: "integer", minimum: 1 } },
    { in: "query", name: "entity", schema: { type: "string", maxLength: 50 } },
    { in: "query", name: "action", schema: { type: "string", maxLength: 20 } },
  ],
};
