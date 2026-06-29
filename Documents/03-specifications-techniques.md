# RepView — Spécifications techniques

> Version : 1.0
> Dernière mise à jour : 14 juin 2026
> Statut : En cours de développement

---

## 1. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Mobile | React Native + Expo | SDK 54 |
| Backend | Firebase Cloud Functions | Node.js 18 |
| Base de données | Cloud Firestore | — |
| Authentification | Firebase Auth | — |
| Hébergement web | Firebase Hosting | — |
| SMS | Twilio Programmable SMS | API v2010 |
| Paiement | Stripe Billing | API v2024 |

---

## 2. Sécurité

### 2.1 Authentification

- Méthode : Firebase Auth (email + mot de passe)
- Token : JWT signé par Firebase, validé côté serveur sur chaque appel Cloud Function
- Durée de session : 1 heure (refresh automatique par le SDK Firebase)
- Mot de passe : minimum 8 caractères (validation côté client et Firebase)

### 2.2 Autorisation

- Modèle : isolation par `uid` — chaque artisan n'accède qu'à ses propres données
- Firestore rules : lecture/écriture conditionnée à `request.auth.uid == uid`
- Cloud Functions : vérification du token via `context.auth.uid` avant tout traitement
- Page de notation : accès public (pas d'authentification), mais lien à usage unique vérifié en base

### 2.3 Protection des données personnelles

| Donnée | Traitement | Stockage |
|--------|-----------|----------|
| Numéro de téléphone du client | Hash SHA-256 avant stockage | Stocké uniquement sous forme hashée (`phoneHash`) |
| 4 derniers chiffres du numéro | Masqués (ex: ••••78) | Stocké pour affichage (`phoneLast4`) |
| Email de l'artisan | En clair | Firestore (`users/{uid}/email`) |
| Nom du client | En clair | Firestore (`requests/{id}/clientName`) |
| Notes | En clair | Firestore (`ratings/{id}/score`) |

### 2.4 Sécurité des API

- Cloud Functions exposées en HTTPS uniquement (TLS 1.3, géré par Firebase)
- Validation des entrées sur chaque fonction :
  - `sendSMS` : vérification format téléphone, longueur nom, plan actif
  - `submitRating` : vérification score (entier entre 1 et 5), existence de la request
  - `stripeWebhook` : vérification de la signature Stripe (`stripe-signature` header)
- Rate limiting : limité par les quotas Firebase (pas de rate limiting custom dans le MVP)

### 2.5 Secrets et clés

| Secret | Stockage | Accès |
|--------|----------|-------|
| Twilio Account SID | `functions/.env` | Cloud Functions uniquement |
| Twilio Auth Token | `functions/.env` | Cloud Functions uniquement |
| Stripe Secret Key | `functions/.env` | Cloud Functions uniquement |
| Stripe Webhook Secret | `functions/.env` | Cloud Functions uniquement |
| Firebase Config (client) | `app/firebaseConfig.js` | Publique (par design Firebase) |

Les fichiers `.env` ne sont jamais commités dans Git (ajoutés au `.gitignore`).

---

## 3. Performance

### 3.1 Objectifs

| Métrique | Objectif |
|----------|---------|
| Temps de chargement app (première ouverture) | < 3 secondes |
| Temps d'envoi SMS (bouton → confirmation) | < 2 secondes |
| Temps de chargement page de notation | < 1.5 secondes |
| Temps de rafraîchissement dashboard (temps réel) | < 500 ms |

### 3.2 Optimisations

- Firestore realtime listeners : le dashboard se met à jour sans requête manuelle
- Page de notation : HTML/CSS/JS statique, aucun framework lourd, hébergé sur CDN Firebase global
- Cloud Functions : cold start minimisé par un code léger et peu de dépendances
- Images : aucune image lourde dans le MVP (émojis et icônes système uniquement)

### 3.3 Limites connues

- Cold start des Cloud Functions : 1 à 3 secondes lors du premier appel après inactivité
- Mode tunnel Expo : latence supplémentaire en développement (non applicable en production)

---

## 4. Base de données

### 4.1 Modèle de données Firestore

```
firestore-root/
│
├── users/{uid}
│   ├── email             : string
│   ├── businessName      : string
│   ├── googleReviewUrl   : string
│   ├── plan              : string      ["free", "pro", "annual"]
│   ├── stripeCustomerId  : string
│   ├── createdAt         : timestamp
│   └── updatedAt         : timestamp
│
├── users/{uid}/requests/{requestId}
│   ├── clientName        : string
│   ├── phoneHash         : string      [SHA-256]
│   ├── phoneLast4        : string      ["••••78"]
│   ├── status            : string      ["sent", "rated", "redirected"]
│   ├── sentAt            : timestamp
│   └── ratedAt           : timestamp | null
│
└── users/{uid}/ratings/{ratingId}
    ├── score             : number      [1-5]
    ├── requestId         : string
    ├── redirectedGoogle   : boolean
    └── ratedAt           : timestamp
```

### 4.2 Index requis

| Collection | Champs indexés | Ordre |
|------------|---------------|-------|
| `users/{uid}/ratings` | `ratedAt` | Décroissant |
| `users/{uid}/requests` | `status`, `sentAt` | `sentAt` décroissant |

### 4.3 Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /requests/{requestId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /ratings/{ratingId} {
        allow read: if request.auth != null && request.auth.uid == uid;
        // Écriture via Admin SDK uniquement (Cloud Functions)
      }
    }
  }
}
```

---

## 5. Cloud Functions — Spécifications techniques

### 5.1 sendSMS

```
Endpoint : HTTPS callable
Authentification : Firebase Auth (obligatoire)
Entrées :
  - clientName : string (optionnel, défaut "Cher client")
  - phoneNumber : string (obligatoire, format E.164 : +33612345678)
Traitement :
  1. Vérifier request.auth.uid
  2. Lire users/{uid} → vérifier plan != "free"
  3. Hasher phoneNumber en SHA-256
  4. Créer document dans users/{uid}/requests/
  5. Envoyer SMS via Twilio
  6. Retourner { success: true, requestId }
Erreurs :
  - 401 : non authentifié
  - 403 : plan gratuit, envoi interdit
  - 400 : numéro invalide
  - 500 : échec Twilio
```

### 5.2 submitRating

```
Endpoint : HTTPS public (pas d'authentification)
Entrées :
  - uid : string (identifiant artisan)
  - requestId : string (identifiant demande)
  - score : number (1 à 5)
Traitement :
  1. Vérifier que users/{uid}/requests/{requestId} existe et status == "sent"
  2. Créer document dans users/{uid}/ratings/
  3. Mettre à jour request.status = "rated" et request.ratedAt
  4. Si score >= 4, lire users/{uid}.googleReviewUrl
  5. Retourner { success: true, googleUrl: "..." | null }
Erreurs :
  - 400 : paramètres manquants ou invalides
  - 404 : request non trouvée
  - 409 : request déjà notée
```

### 5.3 stripeWebhook

```
Endpoint : HTTPS public
Authentification : vérification de la signature Stripe
Événements :
  - checkout.session.completed → mettre plan = "pro" ou "annual"
  - invoice.paid → confirmer renouvellement
  - customer.subscription.deleted → mettre plan = "free"
Traitement :
  1. Vérifier la signature avec STRIPE_WEBHOOK_SECRET
  2. Extraire le customer_id et l'événement
  3. Trouver l'utilisateur par stripeCustomerId
  4. Mettre à jour le champ plan
```

---

## 6. Infrastructure

### 6.1 Firebase — Quotas gratuits (plan Blaze)

| Service | Quota gratuit | Usage estimé MVP |
|---------|--------------|------------------|
| Firestore lectures | 50 000/jour | ~2 000/jour |
| Firestore écritures | 20 000/jour | ~500/jour |
| Cloud Functions invocations | 2 000 000/mois | ~5 000/mois |
| Hosting bande passante | 10 Go/mois | < 1 Go/mois |
| Auth utilisateurs | Illimité | < 500 |

### 6.2 Monitoring

- **Erreurs** : Firebase Crashlytics (mobile) + Console Cloud Functions (logs)
- **Performance** : Firebase Performance Monitoring (temps de chargement écrans)
- **Alertes budget** : alerte à 5 € configurée dans Firebase Console

### 6.3 Déploiement

```bash
# Déployer Cloud Functions + page de notation
firebase deploy --only functions,hosting

# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules

# Builder l'app mobile pour les stores
cd app
npx eas build --platform ios
npx eas build --platform android
```

---

## 7. Gestion des erreurs

| Situation | Comportement |
|-----------|-------------|
| Perte de connexion internet (app mobile) | Message "Pas de connexion", les données en cache restent affichées |
| Échec envoi SMS (Twilio down) | Message "Envoi échoué", la request n'est pas créée |
| Cloud Function timeout (> 60s) | Retry automatique Firebase, log d'erreur |
| Stripe webhook non reçu | Stripe retente automatiquement pendant 72h |
| Lien de notation invalide | Page affiche "Lien invalide ou expiré" |
| Firestore quota dépassé | Dégradation gracieuse, message d'erreur utilisateur |

---

## 8. Tests

### 8.1 Stratégie de test

| Type | Outil | Couverture |
|------|-------|-----------|
| Unitaires (Cloud Functions) | Jest | Logique métier : hash, validation, formatage |
| Intégration (Cloud Functions) | Firebase Emulator Suite | Flux complets avec Firestore émulé |
| E2E (App mobile) | Manuel via Expo Go | Parcours complets sur vrai device |
| SMS (Twilio) | Mode test Twilio | Envoi vérifié sans coût |
| Paiement (Stripe) | Mode test Stripe | Flux complet avec cartes test |

### 8.2 Données de test

| Donnée | Valeur test |
|--------|-------------|
| Carte Stripe succès | 4242 4242 4242 4242 |
| Carte Stripe échec | 4000 0000 0000 0002 |
| Numéro Twilio test | +15005550006 (succès) |
| Numéro Twilio échec | +15005550001 (invalide) |
