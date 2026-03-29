const express = require("express");
const { body, validationResult } = require("express-validator");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();
  if (error) return res.status(404).json({ error: "Profil introuvable." });
  res.json(data);
});

router.patch("/me", authMiddleware,
  body("age").optional().isInt({ min: 18, max: 99 }),
  body("bio").optional().isLength({ max: 300 }),
  body("name").optional().trim().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const allowed = [
      "name", "age", "gender", "seeking", "city", "country", "bio", "job",
      "photos", "trait_adventure", "trait_creativity", "trait_ambition",
      "trait_empathy", "trait_humor", "trait_independence",
      "trait_stability", "trait_spontaneity",
      "relation_type", "values", "dealbreakers",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data: current } = await supabase
      .from("profiles")
      .select("name,age,gender,seeking,city,photos")
      .eq("id", req.user.id)
      .single();

    const merged = { ...current, ...updates };
    updates.is_complete = !!(
      merged.name && merged.age && merged.gender &&
      merged.seeking?.length > 0 && merged.city
    );

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }
);

router.get("/:id", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,age,gender,city,bio,job,photos,trait_adventure,trait_creativity,trait_ambition,trait_empathy,trait_humor,trait_independence,trait_stability,trait_spontaneity,relation_type,values")
    .eq("id", req.params.id)
    .eq("is_active", true)
    .eq("is_complete", true)
    .single();
  if (error) return res.status(404).json({ error: "Profil introuvable." });
  res.json(data);
});

router.post("/me/photo", authMiddleware, async (req, res) => {
  const { base64, filename, contentType } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "Données manquantes." });

  const buffer = Buffer.from(base64, "base64");
  const path = `${req.user.id}/${Date.now()}_${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, buffer, { contentType: contentType || "image/jpeg" });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(path);

  const { data: profile } = await supabase
    .from("profiles")
    .select("photos")
    .eq("id", req.user.id)
    .single();

  const photos = [...(profile.photos || []), urlData.publicUrl];

  await supabase.from("profiles").update({ photos }).eq("id", req.user.id);

  res.json({ url: urlData.publicUrl, photos });
});

router.delete("/me", authMiddleware, async (req, res) => {
  await supabase.from("profiles").update({ is_active: false }).eq("id", req.user.id);
  res.json({ message: "Compte désactivé." });
});

module.exports = router;