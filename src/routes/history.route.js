import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { createHistoryController } from '../controllers/history.controller.js';

export function createHistoryRouters(db) {
  const controller = createHistoryController(db);
  const stockMovementRouter = Router();
  const auditLogRouter = Router();
  stockMovementRouter.get('/', controller.stockMovements);
  auditLogRouter.get('/', controller.auditLogs);
  return { stockMovementRouter, auditLogRouter };
}
export const { stockMovementRouter, auditLogRouter } = createHistoryRouters(prisma);
