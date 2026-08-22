import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/routes";

const app = express();

// ✅ Use a named wildcard route for Express 5 compatibility
app.options("/{*splat}", cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// ✅ General CORS middleware for all routes
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// ✅ Main route handler
app.use(routes);

mongoose.connect(process.env.MONGO_URI || "")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

export default app;
