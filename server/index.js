import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import dayRoutes from "./routes/dayRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import recommendRoutes from "./routes/recommendRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/calories-calculator";
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/days", dayRoutes);
app.use("/food", foodRoutes);
app.use("/recommend", recommendRoutes);

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({
    message: error.message || "Internal server error."
  });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
