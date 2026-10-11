import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import searchRoutes from "./routes/searchRoutes";
import collegeRoutes from "./routes/collegeRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import reportRoutes from "./routes/reportRoutes";
import photoRoutes from "./routes/photoRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import aiRoutes from "./routes/aiRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// Needed so rate limiting sees the real client IP behind Render's proxy.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "SafeStay Student API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
