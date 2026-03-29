# AFTER — Backend API

## Stack
- **Node.js** + Express
- **Supabase** (PostgreSQL + Auth + Storage)
- **Anthropic Claude** (génération des simulations)
- **Stripe** (abonnements)

## Installation

```bash
npm install
cp .env.example .env
# Remplis .env avec tes clés
npm run dev
```

## Setup Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute `supabase/schema.sql`
3. Dans **Storage**, crée un bucket `profile-photos` (public)
4. Copie `SUPABASE_URL` et les clés dans `.env`

## Setup Stripe

1. Crée un compte [stripe.com](https://stripe.com)
2. Crée deux produits : **Premium (9.99€/mois)** et **Gold (19.99€/mois)**
3. Copie les `price_id` dans `.env`
4. Pour les webhooks en local : `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`

## Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → JWT |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Déconnexion |

### Profils
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/profiles/me` | Mon profil complet |
| PATCH | `/api/profiles/me` | Mettre à jour mon profil |
| GET | `/api/profiles/:id` | Profil public d'un user |
| POST | `/api/profiles/me/photo` | Upload photo (base64) |

### Discover & Matching
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/matches/discover` | Profils compatibles scorés |
| POST | `/api/matches/action` | like / pass / superlike |
| GET | `/api/matches` | Mes matches mutuels |
| GET | `/api/matches/:id/messages` | Messages d'un match |
| POST | `/api/matches/:id/messages` | Envoyer un message |

### Simulations IA
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/simulations/generate` | Génère une simulation |
| GET | `/api/simulations` | Mes simulations |
| GET | `/api/simulations/:id` | Une simulation |

### Abonnements
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/subscriptions/checkout` | Crée session Stripe |
| GET | `/api/subscriptions/status` | Mon plan + crédits |
| POST | `/api/subscriptions/webhook` | Webhook Stripe |

## Algorithme de matching

Le score (0-100) est calculé en 4 dimensions :
- **Traits de personnalité** (40%) — similarité + complémentarité selon le trait
- **Valeurs communes** (30%) — coefficient Jaccard
- **Type de relation** (20%) — overlap des intentions
- **Proximité géographique** (10%) — même ville / même pays

## Monétisation

| Plan | Prix | Simulations |
|------|------|-------------|
| Free | 0€ | 3 à l'inscription |
| Premium | 9.99€/mois | Illimitées |
| Gold | 19.99€/mois | Illimitées + features bonus |
