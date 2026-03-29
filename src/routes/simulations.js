const express = require("express");
const rateLimit = require("express-rate-limit");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const { generateSimulation } = require("../services/anthropic");

const router = express.Router();

// Rate limit strict sur les simulations (coûteuses en tokens)
const simLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: "Limite de simulations atteinte pour cette heure." },
});

// ── POST /api/simulations/generate ──────────────────────────
router.post("/generate", authMiddleware, simLimit, async (req, res) => {
  const { target_id } = req.body;
  if (!target_id) return res.status(400).json({ error: "target_id manquant." });

  // Mon profil
  const { data: me, error: meError } = await supabase
    .from("profiles").select("*").eq("id", req.user.id).single();
  if (meError || !me?.is_complete)
    return res.status(400).json({ error: "Complète ton profil d'abord." });

  // Profil cible
  const { data: target, error: targetError } = await supabase
    .from("profiles").select("*").eq("id", target_id).eq("is_active", true).single();
  if (targetError || !target)
    return res.status(404).json({ error: "Profil introuvable." });

  // Simulation déjà existante ?
  const { data: existing } = await supabase
    .from("simulations")
    .select("*")
    .eq("requester_id", req.user.id)
    .eq("target_id", target_id)
    .single();

  if (existing) return res.json({ simulation: existing, cached: true });

  // Vérifie les crédits
  if (me.plan === "free" && me.simulations_left <= 0) {
    return res.status(402).json({
      error: "Plus de simulations gratuites.",
      code: "NO_CREDITS",
      upgrade_url: "/subscribe",
    });
  }

  // Génère la simulation
  let result;
  try {
    result = await generateSimulation(me, target);
  } catch (err) {
    console.error("Anthropic error:", err);
    return res.status(500).json({ error: "Erreur de génération. Réessaie." });
  }

  const { data: sim, chemistry, tag, weeks1, months1, months6, year1 } = result.data;

  // Sauvegarde en DB
  const { data: saved, error: saveError } = await supabase
    .from("simulations")
    .insert({
      requester_id: req.user.id,
      target_id,
      chemistry: result.data.chemistry,
      tag: result.data.tag,
      chapter_week1: result.data.weeks1,
      chapter_month1: result.data.months1,
      chapter_month6: result.data.months6,
      chapter_year1: result.data.year1,
      model_used: "claude-sonnet-4-20250514",
      tokens_used: result.tokens,
      generation_ms: result.ms,
    })
    .select()
    .single();

  if (saveError) return res.status(500).json({ error: saveError.message });

  // Décrément crédits si free
  if (me.plan === "free") {
    await supabase
      .from("profiles")
      .update({ simulations_left: me.simulations_left - 1 })
      .eq("id", req.user.id);
  }

  res.status(201).json({ simulation: saved, cached: false });
});

// ── GET /api/simulations/:id ─────────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", req.params.id)
    .eq("requester_id", req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Simulation introuvable." });
  res.json(data);
});

// ── GET /api/simulations ─────────────────────────────────────
// Toutes mes simulations
router.get("/", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("simulations")
    .select(`
      id, created_at, chemistry, tag,
      target:target_id(id, name, age, city, photos, job)
    `)
    .eq("requester_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ simulations: data });
});

module.exports = router;
