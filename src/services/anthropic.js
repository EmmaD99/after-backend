const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRAIT_LABELS = {
  trait_adventure: "aventurier",
  trait_creativity: "créatif",
  trait_ambition: "ambitieux",
  trait_empathy: "empathique",
  trait_humor: "drôle",
  trait_independence: "indépendant",
  trait_stability: "stable",
  trait_spontaneity: "spontané",
};

function profileToText(p) {
  const traits = Object.entries(TRAIT_LABELS)
    .map(([key, label]) => {
      const val = p[key] || 3;
      if (val >= 4) return label;
      if (val <= 2) return `peu ${label}`;
      return null;
    })
    .filter(Boolean);

  return `${p.name}, ${p.age} ans, ${p.job || "sans précision"}, ${p.city}.
Bio : "${p.bio || "Pas de bio."}"
Traits dominants : ${traits.join(", ") || "équilibré"}.
Valeurs : ${(p.values || []).join(", ") || "non précisées"}.
Cherche : ${(p.relation_type || []).join(", ") || "non précisé"}.`;
}

async function generateSimulation(profile1, profile2) {
  const prompt = `Tu es le moteur narratif de l'app AFTER — une app de dating révolutionnaire qui montre le futur d'une relation avant même que les gens se rencontrent.

PROFIL 1 (l'utilisateur) :
${profileToText(profile1)}

PROFIL 2 (le candidat) :
${profileToText(profile2)}

Génère une simulation de leur relation en 4 chapitres temporels. Sois précis, authentique, émotionnellement juste. Évite les clichés — montre des vrais moments humains, y compris les imperfections.

Réponds UNIQUEMENT en JSON valide, sans backticks ni markdown :

{
  "chemistry": <int 0-100>,
  "tag": "<3-4 mots qui capturent l'essence de leur connexion>",
  "weeks1": {
    "type": "messages",
    "title": "<titre poétique>",
    "vibe": "<ambiance en 2-3 mots>",
    "content": [
      {"from": "user", "text": "<message>"},
      {"from": "match", "text": "<message>"},
      {"from": "user", "text": "<message>"},
      {"from": "match", "text": "<message>"},
      {"from": "user", "text": "<message>"},
      {"from": "match", "text": "<message>"}
    ]
  },
  "months1": {
    "type": "moment",
    "title": "<titre>",
    "vibe": "<ambiance>",
    "scene": "<narration immersive au présent, 3-4 phrases sensorielles>",
    "detail": "<un détail révélateur de leur dynamique>"
  },
  "months6": {
    "type": "dispute",
    "title": "<titre>",
    "vibe": "<ambiance>",
    "trigger": "<ce qui a déclenché la tension, en 1 phrase>",
    "exchange": [
      {"from": "user", "text": "<réplique>"},
      {"from": "match", "text": "<réplique>"},
      {"from": "user", "text": "<réplique>"},
      {"from": "match", "text": "<réplique>"},
      {"from": "user", "text": "<réplique>"}
    ],
    "resolution": "<comment ça s'est résolu, 1-2 phrases>"
  },
  "year1": {
    "type": "snapshot",
    "title": "<titre>",
    "vibe": "<ambiance>",
    "scenes": [
      "<scène du quotidien, 2 phrases>",
      "<moment de joie ou de complicité, 2 phrases>",
      "<ce que chacun a changé dans l'autre, 2 phrases>"
    ],
    "verdict": "<une seule phrase qui résume tout>"
  }
}`;

  const start = Date.now();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const ms = Date.now() - start;
  const text = response.content.map((c) => c.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  return {
    data: parsed,
    tokens: response.usage?.input_tokens + response.usage?.output_tokens,
    ms,
  };
}

module.exports = { generateSimulation };
