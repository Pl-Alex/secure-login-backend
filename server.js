const express = require("express");
const cors = require("cors");
const prisma = require("./prisma/client");
const {
  apiLimiter,
  authLimiter,
  twoFALimiter,
} = require("./middleware/rateLimiter");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const twoFARoutes = require("./routes/2fa");

const app = express();
app.use(apiLimiter);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.json());

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/2fa", twoFALimiter, twoFARoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
