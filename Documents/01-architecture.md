# RepView — Document d'architecture

> Version : 1.0
> Dernière mise à jour : 14 juin 2026
> Statut : En cours de développement

---

## 1. Vue d'ensemble

RepView est une application mobile destinée aux artisans et commerçants pour collecter les avis clients par SMS et filtrer les avis positifs vers Google Reviews.

L'architecture repose sur 4 composants principaux qui communiquent via des APIs et des événements Firebase.

---

## 2. Composants du système

### 2.1 Application mobile (Client)

- **Technologie** : React Native + Expo
- **Plateforme** : iOS et Android
- **Rôle** : Interface artisan — envoi de demandes d'avis, consultation du dashboard, gestion du compte
- **Communication** : Firestore (temps réel), Cloud Functions (appels HTTPS)
- **Authentification** : Firebase Auth (email/mot de passe)
- **Stockage local** : Aucun (tout dans Firestore, pas de données sensibles sur le téléphone)

### 2.2 Backend (Cloud Functions Firebase)

- **Technologie** : Node.js (JavaScript)
- **Hébergement** : Firebase Cloud Functions (serverless)
- **Rôle** : Logique métier côté serveur — envoi SMS, enregistrement des notes, gestion des webhooks de paiement
- **Fonctions exposées** :
  - `sendSMS` — envoie un SMS via Twilio et crée la demande dans Firestore
  - `submitRating` — reçoit la note du client et l'enregistre
  - `stripeWebhook` — reçoit les événements de paiement Stripe
- **Sécurité** : Vérification du token Firebase Auth sur chaque appel, validation des entrées

### 2.3 Page de notation (Web)

- **Technologie** : HTML / CSS / JavaScript (statique)
- **Hébergement** : Firebase Hosting
- **URL** : `https://repview.web.app/rate?id={requestId}&u={uid}`
- **Rôle** : Page publique que le client voit quand il clique sur le lien SMS. Permet de noter de 1 à 5 étoiles.
- **Communication** : Appelle la Cloud Function `submitRating`
- **Particularité** : Aucune authentification requise (accès public via lien unique)

### 2.4 Base de données (Firestore)

- **Technologie** : Cloud Firestore (NoSQL, temps réel)
- **Hébergement** : Firebase (Google Cloud)
- **Rôle** : Stockage de toutes les données — utilisateurs, demandes d'avis, notes
- **Accès** :
  - L'app mobile lit/écrit via le SDK Firebase (règles de sécurité Firestore)
  - Les Cloud Functions lisent/écrivent via le Firebase Admin SDK (accès complet)
  - La page de notation n'a pas d'accès direct (passe par la Cloud Function)

---

## 3. Services externes

### 3.1 Twilio (SMS)

- **Rôle** : Envoi des SMS aux clients
- **Communication** : Appelé par la Cloud Function `sendSMS` via l'API REST Twilio
- **Flux** : Cloud Function → API Twilio → SMS vers le téléphone du client
- **Coût** : ~0.04 €/SMS

### 3.2 Stripe (Paiement)

- **Rôle** : Gestion des abonnements (9 €/mois ou 79 €/an)
- **Communication** :
  - L'app mobile redirige vers Stripe Checkout pour le paiement
  - Stripe envoie des webhooks vers la Cloud Function `stripeWebhook`
- **Flux** : App → Stripe Checkout → paiement → webhook → Cloud Function → mise à jour Firestore
- **Événements écoutés** : `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`

### 3.3 Google Business Profile

- **Rôle** : Destination finale des avis positifs
- **Communication** : Lien direct (URL) — aucune intégration API dans le MVP
- **Flux** : La page de notation affiche un bouton avec l'URL Google Reviews de l'artisan

---

## 4. Flux de données

### 4.1 Flux principal — Collecte d'un avis

```
┌──────────┐     ┌──────────────┐     ┌─────────┐     ┌────────────┐
│  Artisan │     │ Cloud Func.  │     │  Twilio  │     │   Client   │
│  (App)   │     │  sendSMS     │     │  (SMS)   │     │ (Téléphone)│
└────┬─────┘     └──────┬───────┘     └────┬─────┘     └──────┬─────┘
     │                  │                  │                   │
     │ 1. Saisit nom +  │                  │                   │
     │    numéro        │                  │                   │
     │ ──────────────>  │                  │                   │
     │                  │ 2. Hash numéro   │                   │
     │                  │    Crée request  │                   │
     │                  │    dans Firestore│                   │
     │                  │ ──────────────>  │                   │
     │                  │                  │ 3. SMS avec lien  │
     │                  │                  │ ──────────────>   │
     │                  │                  │                   │
     │                  │                  │   4. Clique lien  │
     │                  │                  │ <──────────────   │
     │                  │                  │                   │
     │                  │                  │                   │
     │    ┌─────────────────┐              │                   │
     │    │ Page de notation │              │    5. Note 1-5   │
     │    │ (Firebase Host.) │<─────────────│───────────────   │
     │    └────────┬────────┘              │                   │
     │             │                       │                   │
     │             │ 6. Appelle submitRating│                   │
     │             │ ──────────────>       │                   │
     │             │                       │                   │
     │  7. Note apparaît                   │                   │
     │     dans le dashboard               │                   │
     │  (Firestore temps réel)             │                   │
     │ <──────────────                     │                   │
     │                                     │                   │
     │  Si note >= 4 :                     │                   │
     │  Page affiche bouton Google ──────────────────────────> │
     │                                     │    8. Client va   │
     │                                     │    sur Google     │
```

### 4.2 Flux de paiement

```
Artisan (App) → Stripe Checkout → Paiement → Webhook → Cloud Function → Firestore (plan = "pro")
```

### 4.3 Flux d'authentification

```
Artisan (App) → Firebase Auth (email/mdp) → Token JWT → accès Firestore (règles basées sur uid)
```

---

## 5. Diagramme des composants

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Firestore   │  │  Auth        │  │  Hosting               │ │
│  │               │  │              │  │                        │ │
│  │  users/       │  │  Email/MDP   │  │  Page de notation      │ │
│  │  requests/    │  │  → Token JWT │  │  (HTML/CSS/JS)         │ │
│  │  ratings/     │  │              │  │                        │ │
│  └──────┬───────┘  └──────────────┘  └────────────────────────┘ │
│         │                                                        │
│  ┌──────┴──────────────────────────────┐                        │
│  │         Cloud Functions              │                        │
│  │                                      │                        │
│  │  sendSMS ──────────> Twilio          │                        │
│  │  submitRating                        │                        │
│  │  stripeWebhook <──── Stripe          │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │ SDK Firebase                       │ HTTPS (lien SMS)
           │ (temps réel)                       │
    ┌──────┴───────┐                    ┌───────┴──────┐
    │  App Mobile   │                    │    Client     │
    │  (Artisan)    │                    │  (Navigateur) │
    │  React Native │                    │              │
    └──────────────┘                    └──────────────┘
```

---

## 6. Environnements

| Environnement | Firebase Project | Stripe Mode | Twilio | Usage |
|---------------|-----------------|-------------|--------|-------|
| Développement | repview (default) | Test (sk_test_) | Essai (crédit offert) | Dev local + Expo Go |
| Production | repview-prod (à créer) | Live (sk_live_) | Production | App Store / Play Store |

---

## 7. Décisions d'architecture

| Décision | Choix | Justification |
|----------|-------|---------------|
| Mobile framework | React Native + Expo | JavaScript unique pour tout le projet, Claude Code performant en JS |
| Backend | Firebase (serverless) | Zéro serveur à maintenir, tier gratuit généreux |
| Base de données | Firestore (NoSQL) | Temps réel natif, scaling auto, modèle document adapté |
| SMS | Twilio | API fiable, bon prix, SDK Node.js |
| Paiement | Stripe | Standard du marché, webhooks, mode test |
| Hébergement page web | Firebase Hosting | Inclus, CDN global, SSL automatique |
| Pas d'API Google Business | Lien direct URL | Simplifie le MVP, aucune dépendance API Google |

---

## 8. Évolutions futures (hors MVP)

- Intégration API Google Business Profile pour surveiller les avis Google
- Multi-plateformes d'avis (TripAdvisor, Trustpilot, Pages Jaunes)
- Réponses IA aux avis via API Claude
- Dashboard multi-établissements
- QR Code + NFC pour demande d'avis en point de vente
- Envoi WhatsApp Business en complément du SMS
