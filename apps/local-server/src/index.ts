import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExcelStore } from "./storage/excel-store.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const dataDir = path.resolve(process.env.NGINAP_DATA_DIR ?? path.join(rootDir, "data"));
const backupDir = path.resolve(process.env.NGINAP_BACKUP_DIR ?? path.join(rootDir, "backups"));
const workbookPath = path.join(dataDir, "NGINAP_DATABASE.xlsx");
const host = process.env.NGINAP_HOST ?? "127.0.0.1";
const port = Number(process.env.NGINAP_PORT ?? 4100);

const app = express();
const store = new ExcelStore(workbookPath, backupDir);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.NGINAP_ALLOWED_ORIGIN?.split(",") ?? ["http://localhost:3000"] }));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", async (_request, response) => {
  try {
    const status = await store.getStatus();
    response.json({ status: "ok", service: "nginap-local-server", storage: status });
  } catch {
    response.status(503).json({ status: "unavailable", service: "nginap-local-server" });
  }
});

app.use((_request, response) => response.status(404).json({ error: "Not found" }));
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled request error", error);
  response.status(500).json({ error: "Internal server error" });
});

await store.initialize();
app.listen(port, host, () => {
  console.log("Nginap local service listening on http://" + host + ":" + port);
  console.log("Workbook: " + workbookPath);
});
