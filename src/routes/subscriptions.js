const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    simulations: 999, // illimité
    label: "Premium",
    price: "9.99€/mois",
  },
  gold: {
    priceId: process.env.STRIPE_GOLD_PRICE_ID,
    simulations: 999,
    label: "Gold",
    price: "19.99€/mois",
  },
};

// ── POST /api/subscriptions/checkout ────────────────────────
router.post("/checkout", authMiddleware, async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: "Plan invalide." });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscribe/cancel`,
    metadata: { user_id: req.user.id, plan },
    client_reference_id: req.user.id,
  });

  res.json({ url: session.url });
});

// ── POST /api/subscriptions/webhook ─────────────────────────
// Stripe webhook — doit utiliser le body brut
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      const plan = session.metadata.plan;

      await supabase.from("profiles").update({
        plan,
        simulations_left: 999,
      }).eq("id", userId);

      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabase.from("subscriptions")
        .update({ status: "cancelled" })
        .eq("stripe_subscription_id", sub.id);

      // Récupère l'user et remet en free
      const { data: dbSub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", sub.id)
        .single();

      if (dbSub) {
        await supabase.from("profiles").update({
          plan: "free",
          simulations_left: 0,
        }).eq("id", dbSub.user_id);
      }
      break;
    }
  }

  res.json({ received: true });
});

// ── GET /api/subscriptions/status ───────────────────────────
router.get("/status", authMiddleware, async (req, res) => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, simulations_left")
    .eq("id", req.user.id)
    .single();

  res.json({
    plan: profile?.plan || "free",
    simulations_left: profile?.simulations_left || 0,
    plans: PLANS,
  });
});

module.exports = router;
