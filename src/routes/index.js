import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { unitRouter } from "./unit.route.js";
import { customerRouter } from "./customer.route.js";
import { supplierRouter } from "./supplier.route.js";
import { productRouter } from "./product.route.js";
import { accountRouter } from "./account.route.js";
import { productCategoryRouter } from "./productCategory.route.js";
import { userRouter } from "./user.route.js";
import { goodsReceiptRouter } from "./goodsReceipt.route.js";
import { supplierBillRouter } from "./supplierBill.route.js";
import { paymentRouter } from "./payment.route.js";
import { reportRouter } from "./report.route.js";
import { shipmentRouter } from "./shipment.route.js";
import { purchaseRequisitionRouter } from "./purchaseRequisition.route.js";
import { purchaseOrderRouter } from "./purchaseOrder.route.js";
import { quotationRouter } from "./quotation.route.js";
import { salesOrderRouter } from "./salesOrder.route.js";
import { invoiceRouter } from "./invoice.route.js";
import { receiptRouter } from "./receipt.route.js";

import { stockMovementRouter, auditLogRouter } from "./history.route.js";

export const router = Router();
router.use("/stock-movements", requireRole("PURCHASING", "ACCOUNTING"), stockMovementRouter);
router.use("/audit-logs", requireRole("ADMIN"), auditLogRouter);


router.use("/units", unitRouter);
router.use("/customers", customerRouter);
router.use("/suppliers", supplierRouter);
router.use("/products", productRouter);
router.use("/categories", productCategoryRouter);

router.use("/users", requireRole("ADMIN"), userRouter);

router.use("/accounts", requireRole("ACCOUNTING"), accountRouter);
router.use("/reports", requireRole("ACCOUNTING"), reportRouter);

router.use("/purchase-requisitions", requireRole("PURCHASING"), purchaseRequisitionRouter);
router.use("/purchase-orders", requireRole("PURCHASING"), purchaseOrderRouter);
router.use("/goods-receipts", requireRole("PURCHASING"), goodsReceiptRouter);
router.use("/bills", requireRole("PURCHASING", "ACCOUNTING"), supplierBillRouter);
router.use("/payments", requireRole("PURCHASING", "ACCOUNTING"), paymentRouter);

router.use("/quotations", requireRole("SALES"), quotationRouter);
router.use("/sales-orders", requireRole("SALES"), salesOrderRouter);
router.use("/shipments", requireRole("SALES"), shipmentRouter);
router.use("/invoices", requireRole("SALES", "ACCOUNTING"), invoiceRouter);
router.use("/receipts", requireRole("SALES", "ACCOUNTING"), receiptRouter);
