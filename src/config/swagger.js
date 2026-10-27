import { bodies, summaries, queryParameters } from "./apiDocs.js";
import { authRouter } from "../routes/auth.route.js";
import { unitRouter } from "../routes/unit.route.js";
import { customerRouter } from "../routes/customer.route.js";
import { supplierRouter } from "../routes/supplier.route.js";
import { productRouter } from "../routes/product.route.js";
import { accountRouter } from "../routes/account.route.js";
import { productCategoryRouter } from "../routes/productCategory.route.js";
import { userRouter } from "../routes/user.route.js";
import { goodsReceiptRouter } from "../routes/goodsReceipt.route.js";
import { supplierBillRouter } from "../routes/supplierBill.route.js";
import { paymentRouter } from "../routes/payment.route.js";
import { reportRouter } from "../routes/report.route.js";
import { shipmentRouter } from "../routes/shipment.route.js";
import { purchaseRequisitionRouter } from "../routes/purchaseRequisition.route.js";
import { purchaseOrderRouter } from "../routes/purchaseOrder.route.js";
import { quotationRouter } from "../routes/quotation.route.js";
import { salesOrderRouter } from "../routes/salesOrder.route.js";
import { invoiceRouter } from "../routes/invoice.route.js";
import { receiptRouter } from "../routes/receipt.route.js";

import { stockMovementRouter, auditLogRouter } from "../routes/history.route.js";

// resource ที่จะแสดงในหน้า Swagger: "prefix" -> router
// เพิ่ม resource ใหม่ ก็เพิ่ม 1 บรรทัดที่นี่
const resources = {
  auth: authRouter,
  "stock-movements": stockMovementRouter,
  "audit-logs": auditLogRouter,
  units: unitRouter,
  customers: customerRouter,
  suppliers: supplierRouter,
  products: productRouter,
  accounts: accountRouter,
  categories: productCategoryRouter,
  users: userRouter,
  "goods-receipts": goodsReceiptRouter,
  bills: supplierBillRouter,
  payments: paymentRouter,
  reports: reportRouter,
  shipments: shipmentRouter,
  "purchase-requisitions": purchaseRequisitionRouter,
  "purchase-orders": purchaseOrderRouter,
  quotations: quotationRouter,
  "sales-orders": salesOrderRouter,
  invoices: invoiceRouter,
  receipts: receiptRouter,
};

// สร้าง Swagger spec อัตโนมัติจาก router (อ่าน path + method เอง ไม่ต้องเขียน comment)
export function buildSwaggerSpec() {
  const paths = {};

  for (const [name, subRouter] of Object.entries(resources)) {
    for (const layer of subRouter.stack) {
      if (!layer.route) {
        continue;
      }

      // ต่อ path เต็ม: /api + /units + path ของ route แล้วเปลี่ยน :id -> {id}
      const routePath = layer.route.path === "/" ? "" : layer.route.path;
      const fullPath = `/api/${name}${routePath}`.replace(/:(\w+)/g, "{$1}");

      paths[fullPath] = paths[fullPath] || {};

      for (const method of Object.keys(layer.route.methods)) {
        const key = `${method} ${fullPath}`;
        const operation = {
          tags: [name],
          responses: { 200: { description: "OK" } },
        };

        // คำอธิบายสั้นๆ (ถ้ามี)
        if (summaries[key]) {
          operation.summary = summaries[key];
        }

        // ถ้ามี {id} ใน path -> ทำช่องกรอก id ให้
        const idParams = [...fullPath.matchAll(/{(\w+)}/g)].map((x) => ({
          in: "path",
          name: x[1],
          required: true,
          schema: { type: "string" },
        }));
        if (idParams.length > 0) {
          operation.parameters = idParams;
        }

        if (queryParameters[key]) operation.parameters = [...(operation.parameters ?? []), ...queryParameters[key]];

        // ใส่ตัวอย่าง body เฉพาะ endpoint ที่ต้องส่ง body (จาก apiDocs)
        // endpoint แบบ /post /approve /cancel ไม่มีตัวอย่าง = ไม่ต้องส่ง body
        if (bodies[key]) {
          operation.requestBody = {
            required: true,
            content: { "application/json": { schema: { type: "object" }, example: bodies[key] } },
          };
        }

        paths[fullPath][method] = operation;
      }
    }
  }

  return {
    openapi: "3.0.0",
    info: { title: "MiniProjectERP API", version: "1.0.0" },
    servers: [{ url: "https://miniprojecterp.onrender.com" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }], // ทุก endpoint ต้องมี token (ยกเว้น /api/auth ที่ server เปิดไว้)
    paths,
  };
}
