import express from "express";
import cors from "cors";
import { requestId } from "./middleware/requestId";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.route";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(requestId);
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// --- routes -----------------------------------------------------------------
// No database is wired up yet: Focus currently runs on client-side mock data.
// Domain routes land here once the Mongo/Mongoose layer is introduced.
app.use(healthRoutes);

// --- error plumbing (must stay last, in this order) --------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
