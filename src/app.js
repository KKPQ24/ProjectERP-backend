import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { router } from "./routes/index.js";
import { authRouter } from "./routes/auth.route.js";
import { authMiddleware } from "./middleware/auth.js";
import { createAuditMiddleware } from "./middleware/audit.js";
import { AuditLogModel } from "./models/auditLog.model.js";
import { buildSwaggerSpec } from "./config/swagger.js";

export const app = express();

app.use(cors());        
app.use(express.json());

app.use("/api/auth", authRouter);       
app.use("/api", authMiddleware, createAuditMiddleware({ write: (record) => AuditLogModel.create(record) }), router);

const swaggerSpec = buildSwaggerSpec();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
