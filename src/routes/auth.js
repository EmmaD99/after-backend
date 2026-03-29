const express = require("express");
const { body, validationResult } = require("express-validator");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
router.post("/register",
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Mot de passe trop court (min 8 caractères)"),
  body("name").trim().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;

    // Création compte Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // Création profil vide
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        name,
        age: 18, // sera complété à l'onboarding
        gender: "autre",
        seeking: [],
        city: "",
        country: "FR",
      });

    if (profileError) return res.status(500).json({ error: profileError.message });

    res.status(201).json({
      message: "Compte créé. Vérifie ton email.",
      user: { id: data.user.id, email: data.user.email },
    });
  }
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: "Email ou mot de passe incorrect." });

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
    });
  }
);

// ── POST /api/auth/refresh ───────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "refresh_token manquant." });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: "Session expirée." });

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post("/logout", authMiddleware, async (req, res) => {
  await supabase.auth.signOut();
  res.json({ message: "Déconnecté." });
});

module.exports = router;
