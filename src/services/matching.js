/**
 * AFTER — Algorithme de compatibilité
 *
 * Score global (0-100) basé sur :
 * - Compatibilité des traits de personnalité (40%)
 * - Valeurs communes (30%)
 * - Préférences relationnelles (20%)
 * - Proximité géographique (10%)
 */

/**
 * Calcule le score de compatibilité entre deux profils
 * @param {Object} p1 - Profil de l'utilisateur
 * @param {Object} p2 - Profil candidat
 * @returns {{ score: number, breakdown: Object }}
 */
function computeCompatibility(p1, p2) {
  const traits = computeTraitScore(p1, p2);
  const values = computeValuesScore(p1, p2);
  const relation = computeRelationScore(p1, p2);
  const geo = computeGeoScore(p1, p2);

  const score = Math.round(
    traits * 0.40 +
    values * 0.30 +
    relation * 0.20 +
    geo * 0.10
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: { traits, values, relation, geo },
  };
}

/**
 * Compatibilité des traits (complémentarité + similarité)
 * Certains traits s'attirent par similarité (empathie, humour),
 * d'autres par complémentarité (aventure ↔ stabilité).
 */
function computeTraitScore(p1, p2) {
  const traitKeys = [
    "trait_adventure", "trait_creativity", "trait_ambition",
    "trait_empathy", "trait_humor", "trait_independence",
    "trait_stability", "trait_spontaneity",
  ];

  // Traits qui fonctionnent mieux par similarité
  const similarityTraits = new Set(["trait_empathy", "trait_humor", "trait_creativity"]);
  // Traits qui fonctionnent mieux par complémentarité
  const complementaryPairs = {
    trait_adventure: "trait_stability",
    trait_independence: "trait_spontaneity",
  };

  let total = 0;
  let count = 0;

  for (const key of traitKeys) {
    const v1 = p1[key] || 3;
    const v2 = p2[key] || 3;
    const diff = Math.abs(v1 - v2);

    let score;
    if (similarityTraits.has(key)) {
      // Plus proche = mieux (0 diff = 100, 4 diff = 0)
      score = 100 - (diff / 4) * 100;
    } else if (complementaryPairs[key]) {
      // Complémentarité : l'un haut + l'autre bas est bien
      const complementKey = complementaryPairs[key];
      const v1c = p1[complementKey] || 3;
      const v2c = p2[complementKey] || 3;
      const balance = Math.abs((v1 + v2c) - (v2 + v1c));
      score = 100 - (balance / 8) * 100;
    } else {
      // Légère préférence pour similarité
      score = 100 - (diff / 4) * 80;
    }

    total += score;
    count++;
  }

  return Math.round(total / count);
}

/**
 * Valeurs communes
 */
function computeValuesScore(p1, p2) {
  const v1 = new Set(p1.values || []);
  const v2 = new Set(p2.values || []);
  if (v1.size === 0 || v2.size === 0) return 50;

  const intersection = [...v1].filter((v) => v2.has(v)).length;
  const union = new Set([...v1, ...v2]).size;

  // Jaccard + bonus pour beaucoup de valeurs communes
  const jaccard = intersection / union;
  return Math.round(jaccard * 100);
}

/**
 * Type de relation compatible
 */
function computeRelationScore(p1, p2) {
  const r1 = new Set(p1.relation_type || []);
  const r2 = new Set(p2.relation_type || []);
  if (r1.size === 0 || r2.size === 0) return 60;

  const overlap = [...r1].filter((r) => r2.has(r)).length;
  if (overlap === 0) return 10; // aucune compatibilité relationnelle
  return Math.min(100, 40 + overlap * 30);
}

/**
 * Proximité géographique (simplifié — même ville = 100)
 */
function computeGeoScore(p1, p2) {
  if (!p1.city || !p2.city) return 50;
  if (p1.city.toLowerCase() === p2.city.toLowerCase()) return 100;
  if (p1.country === p2.country) return 60;
  return 30;
}

/**
 * Filtrage de base (dealbreakers, seeking, âge)
 */
function isEligible(viewer, candidate) {
  // Orientation
  if (!viewer.seeking?.includes(candidate.gender)) return false;
  if (!candidate.seeking?.includes(viewer.gender)) return false;

  // Dealbreakers (keywords simples)
  const dealbreakers = viewer.dealbreakers || [];
  const candidateValues = [
    ...(candidate.values || []),
    ...(candidate.relation_type || []),
  ];
  for (const d of dealbreakers) {
    if (candidateValues.includes(d)) return false;
  }

  return true;
}

/**
 * Génère un tag textuel basé sur le score
 */
function getChemistryTag(score, breakdown) {
  if (score >= 90) return "Connexion rare";
  if (score >= 80) return "Magnétisme immédiat";
  if (score >= 70) return "Complémentaires";
  if (score >= 60) return "Curieuse alchimie";
  if (score >= 50) return "À découvrir";
  return "Contraste intéressant";
}

module.exports = { computeCompatibility, isEligible, getChemistryTag };
