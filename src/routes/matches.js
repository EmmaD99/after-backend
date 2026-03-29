const express = require("express");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const { computeCompatibility, isEligible, getChemistryTag } = require("../services/matching");

const router = express.Router();

// ── GET /api/matches/discover ────────────────────────────────
// Retourne les profils potentiels avec score de compatibilité
router.get("/discover", authMiddleware, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  // Mon profil
  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (meError || !me?.is_complete) {
    return res.status(400).json({ error: "Complète ton profil d'abord." });
  }

  // Profils déjà vus
  const { data: seen } = await supabase
    .from("match_views")
    .select("viewed_id")
    .eq("viewer_id", req.user.id);

  const seenIds = (seen || []).map((s) => s.viewed_id);
  seenIds.push(req.user.id); // s'exclure soi-même

  // Candidats actifs
  const { data: candidates, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .eq("is_complete", true)
    .not("id", "in", `(${seenIds.join(",")})`)
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  // Filtre + score
  const scored = candidates
    .filter((c) => isEligible(me, c))
    .map((c) => {
      const { score, breakdown } = computeCompatibility(me, c);
      return {
        profile: {
          id: c.id, name: c.name, age: c.age, city: c.city,
          bio: c.bio, job: c.job, photos: c.photos,
          trait_adventure: c.trait_adventure, trait_creativity: c.trait_creativity,
          trait_ambition: c.trait_ambition, trait_empathy: c.trait_empathy,
          trait_humor: c.trait_humor, trait_independence: c.trait_independence,
          trait_stability: c.trait_stability, trait_spontaneity: c.trait_spontaneity,
          relation_type: c.relation_type, values: c.values,
        },
        compatibility: {
          score,
          tag: getChemistryTag(score, breakdown),
          breakdown,
        },
      };
    })
    .sort((a, b) => b.compatibility.score - a.compatibility.score)
    .slice(0, limit);

  // Enregistre les vues
  if (scored.length > 0) {
    const views = scored.map((s) => ({
      viewer_id: req.user.id,
      viewed_id: s.profile.id,
      compatibility_score: s.compatibility.score,
    }));
    await supabase.from("match_views").upsert(views, { onConflict: "viewer_id,viewed_id" });
  }

  res.json({ profiles: scored, total: scored.length });
});

// ── POST /api/matches/action ─────────────────────────────────
// like / pass / superlike
router.post("/action", authMiddleware, async (req, res) => {
  const { target_id, action_type } = req.body;

  if (!target_id || !["like", "pass", "superlike"].includes(action_type)) {
    return res.status(400).json({ error: "Données invalides." });
  }

  const { error } = await supabase.from("actions").upsert({
    actor_id: req.user.id,
    target_id,
    action_type,
  }, { onConflict: "actor_id,target_id" });

  if (error) return res.status(500).json({ error: error.message });

  // Vérifie si match mutuel (le trigger SQL le crée, on vérifie juste)
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${req.user.id})`)
    .single();

  res.json({
    success: true,
    matched: !!match,
    match_id: match?.id || null,
  });
});

// ── GET /api/matches ─────────────────────────────────────────
// Mes matches mutuels
router.get("/", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, created_at, simulation_id,
      user1:user1_id(id,name,age,city,photos,bio,job),
      user2:user2_id(id,name,age,city,photos,bio,job)
    `)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Normalise : retourne toujours "other" comme l'autre profil
  const matches = data.map((m) => ({
    id: m.id,
    created_at: m.created_at,
    simulation_id: m.simulation_id,
    other: m.user1_id === req.user.id ? m.user2 : m.user1,
  }));

  res.json({ matches });
});

// ── GET /api/matches/:id/messages ────────────────────────────
router.get("/:id/messages", authMiddleware, async (req, res) => {
  // Vérifie que l'utilisateur est dans ce match
  const { data: match } = await supabase
    .from("matches")
    .select("id,user1_id,user2_id")
    .eq("id", req.params.id)
    .single();

  if (!match || (match.user1_id !== req.user.id && match.user2_id !== req.user.id)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const { data: msgs, error } = await supabase
    .from("messages")
    .select("id,created_at,sender_id,content,is_read")
    .eq("match_id", req.params.id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Marque comme lu
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("match_id", req.params.id)
    .neq("sender_id", req.user.id);

  res.json({ messages: msgs });
});

// ── POST /api/matches/:id/messages ───────────────────────────
router.post("/:id/messages", authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Message vide." });
  if (content.length > 1000) return res.status(400).json({ error: "Message trop long." });

  const { data: match } = await supabase
    .from("matches")
    .select("id,user1_id,user2_id")
    .eq("id", req.params.id)
    .single();

  if (!match || (match.user1_id !== req.user.id && match.user2_id !== req.user.id)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: req.params.id, sender_id: req.user.id, content })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
