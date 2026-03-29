require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const matchRoutes = require("./routes/matches");
const simulationRoutes = require("./routes/simulations");
const subscriptionRoutes = require("./routes/subscriptions");

const app = express();

// ── Sécurité ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*", credentials: false }));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: { error: "Trop de requêtes, réessaie dans 15 minutes." },
}));

// Body parser (sauf pour Stripe webhooks)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/subscriptions/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/simulations", simulationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", app: "AFTER" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable." });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Erreur serveur interne.",
  });
});

// ── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🖤 AFTER API démarrée sur http://localhost:${PORT}`);
});

module.exports = app;
