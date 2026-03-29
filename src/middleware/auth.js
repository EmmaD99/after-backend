const supabase = require("../services/supabase");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant." });
  }

  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }

  req.user = user;
  next();
};
