# RepView — Spécifications fonctionnelles

> Version : 1.0
> Dernière mise à jour : 14 juin 2026
> Statut : En cours de développement

---

## 1. Description du produit

RepView permet à un artisan ou commerçant de collecter des avis clients par SMS et de filtrer automatiquement les avis positifs vers Google Reviews, protégeant ainsi sa note en ligne.

**Promesse unique** : « Obtenez plus d'avis Google positifs. »

---

## 2. Utilisateurs

### 2.1 Artisan (utilisateur principal)

- Profil : artisan, commerçant, profession libérale
- Compétence technique : faible (smartphone uniquement)
- Fréquence d'usage : quotidienne ou hebdomadaire (après chaque prestation)
- Objectif : améliorer sa note Google sans effort

### 2.2 Client final (utilisateur secondaire)

- Profil : client de l'artisan, tout public
- Compétence technique : basique (cliquer sur un lien SMS)
- Fréquence d'usage : unique (une seule interaction par prestation)
- Objectif : donner son avis rapidement

---

## 3. Fonctionnalités

### F01 — Inscription et connexion

**Description** : L'artisan crée un compte avec son email et un mot de passe, puis se connecte.

**Règles** :
- Email valide obligatoire
- Mot de passe : 8 caractères minimum
- Connexion persistante (pas de déconnexion automatique)
- Récupération de mot de passe par email

**Écran** : LoginScreen

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F01-01 | L'artisan saisit un email valide et un mot de passe de 8+ caractères | Compte créé, redirection vers le dashboard |
| F01-02 | L'artisan saisit un email déjà utilisé | Message d'erreur "Ce compte existe déjà" |
| F01-03 | L'artisan saisit un mot de passe de moins de 8 caractères | Message d'erreur "Mot de passe trop court" |
| F01-04 | L'artisan se connecte avec des identifiants valides | Accès au dashboard |
| F01-05 | L'artisan se connecte avec un mauvais mot de passe | Message d'erreur "Identifiants incorrects" |
| F01-06 | L'artisan clique sur "Mot de passe oublié" | Email de réinitialisation envoyé |

---

### F02 — Configuration du profil

**Description** : L'artisan renseigne le nom de son commerce et son lien Google Reviews.

**Règles** :
- Nom du commerce : obligatoire, 2 à 100 caractères
- URL Google Reviews : optionnelle au départ, obligatoire pour activer la redirection
- L'artisan peut modifier ces informations à tout moment

**Écran** : ProfileScreen (accessible depuis les paramètres)

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F02-01 | L'artisan renseigne son nom de commerce | Le nom apparaît dans le SMS et sur la page de notation |
| F02-02 | L'artisan colle son URL Google Reviews | Les clients notant >= 4 verront le bouton Google |
| F02-03 | L'artisan n'a pas renseigné d'URL Google | Les clients notant >= 4 voient un remerciement sans bouton Google |

---

### F03 — Envoi d'une demande d'avis par SMS

**Description** : L'artisan saisit le nom et le numéro de téléphone d'un client, un SMS est envoyé automatiquement avec un lien de notation.

**Règles** :
- Numéro de téléphone : obligatoire, format français (06/07) ou international (+33)
- Nom du client : optionnel (valeur par défaut : "Cher client")
- Un seul SMS par demande (pas de relance automatique dans le MVP)
- L'artisan doit avoir un plan actif (pro ou annual) pour envoyer

**Contenu du SMS** :
```
"{clientName}, merci pour votre confiance ! Donnez-nous votre avis en 10 secondes 👉 {lien}"
```

**Écran** : SendScreen

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F03-01 | L'artisan saisit un numéro valide et appuie sur "Envoyer" | SMS envoyé, confirmation affichée, demande visible dans l'historique |
| F03-02 | L'artisan saisit un numéro invalide (moins de 10 chiffres) | Bouton grisé, message "Numéro invalide" |
| F03-03 | L'artisan sans plan actif tente d'envoyer | Message "Abonnez-vous pour envoyer des SMS" avec lien vers la page d'abonnement |
| F03-04 | Échec d'envoi SMS (erreur Twilio) | Message d'erreur "Envoi échoué, veuillez réessayer" |
| F03-05 | L'artisan envoie à un numéro déjà contacté dans les 7 derniers jours | Avertissement "Ce client a déjà été contacté récemment. Envoyer quand même ?" |

---

### F04 — Page de notation client

**Description** : Le client clique sur le lien du SMS et arrive sur une page web où il note de 1 à 5.

**Règles** :
- La page affiche le nom du commerce de l'artisan
- 5 options de notation (émojis ou étoiles)
- Un seul clic suffit pour noter (pas de formulaire à soumettre)
- Un lien ne peut être utilisé qu'une seule fois
- Si note >= 4 : affichage du bouton "Laisser un avis Google" (si URL configurée)
- Si note < 4 : affichage d'un message de remerciement, pas de bouton Google
- La page est responsive (mobile-first, le client vient d'un SMS)

**Page** : public/index.html (Firebase Hosting)

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F04-01 | Le client clique le lien et donne une note de 5 | Message de remerciement + bouton "Laisser un avis Google" |
| F04-02 | Le client clique le lien et donne une note de 4 | Message de remerciement + bouton "Laisser un avis Google" |
| F04-03 | Le client clique le lien et donne une note de 3 | Message de remerciement, pas de bouton Google |
| F04-04 | Le client clique le lien et donne une note de 1 | Message de remerciement, pas de bouton Google |
| F04-05 | Le client clique sur le bouton Google | Redirection vers la page Google Reviews de l'artisan |
| F04-06 | Le client tente d'utiliser un lien déjà utilisé | Message "Vous avez déjà donné votre avis. Merci !" |
| F04-07 | Le client clique un lien avec un ID invalide | Message d'erreur "Lien invalide" |

---

### F05 — Dashboard

**Description** : Tableau de bord affichant les indicateurs clés de la réputation de l'artisan.

**Indicateurs affichés** :
- Note moyenne (1 à 5, une décimale)
- Nombre total d'avis reçus
- Nombre de demandes en attente
- Taux de réponse (% de demandes ayant reçu une note)
- Taux de satisfaction (% de notes >= 4)
- Répartition des notes (barres horizontales 1 à 5 étoiles)
- Liste des 5 derniers avis reçus

**Règles** :
- Les données se rafraîchissent en temps réel (Firestore realtime)
- Le dashboard est la première page affichée après connexion

**Écran** : DashboardScreen

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F05-01 | L'artisan ouvre l'app avec des avis existants | Dashboard affiché avec tous les indicateurs à jour |
| F05-02 | Un client note pendant que l'artisan regarde le dashboard | La note apparaît en temps réel sans rafraîchir |
| F05-03 | L'artisan n'a aucun avis | Dashboard affiché avec des valeurs à zéro et un message d'invitation à envoyer son premier SMS |

---

### F06 — Historique des avis

**Description** : Liste chronologique de toutes les demandes envoyées et des notes reçues.

**Informations affichées par ligne** :
- Nom du client
- 4 derniers chiffres du numéro (masqués)
- Date d'envoi
- Statut : envoyé / noté / redirigé vers Google
- Note (si reçue)

**Règles** :
- Trié par date décroissante (plus récent en haut)
- Les notes < 4 sont marquées visuellement ("À traiter")
- Les notes >= 4 avec clic Google sont marquées ("→ Google ✓")

**Écran** : HistoryScreen

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F06-01 | L'artisan consulte l'historique | Liste complète, triée par date décroissante |
| F06-02 | L'artisan voit un avis avec note 2 | Badge "À traiter" affiché en rouge |
| F06-03 | L'artisan voit un avis avec note 5 redirigé | Badge "→ Google ✓" affiché en vert |

---

### F07 — Abonnement et paiement

**Description** : L'artisan souscrit un abonnement pour accéder à l'envoi de SMS.

**Plans disponibles** :
| Plan | Prix | Durée | Badge |
|------|------|-------|-------|
| Gratuit | 0 € | — | Accès au dashboard uniquement, pas d'envoi SMS |
| Pro mensuel | 9 €/mois | Reconductible | Envoi SMS illimité |
| Pro annuel | 79 €/an | Reconductible | Envoi SMS illimité, badge "-27%" |

**Règles** :
- Le plan annuel est mis en avant comme "Recommandé"
- Le paiement est géré via Stripe Checkout (redirection navigateur)
- L'artisan peut annuler à tout moment depuis l'app
- Après annulation, l'accès reste actif jusqu'à la fin de la période payée
- Pas de remboursement au prorata

**Écran** : SubscriptionScreen (accessible depuis les paramètres)

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F07-01 | L'artisan choisit le plan Pro mensuel | Redirection vers Stripe, paiement, retour à l'app avec plan actif |
| F07-02 | L'artisan choisit le plan Pro annuel | Idem, plan "annual" actif |
| F07-03 | Le paiement Stripe échoue | Message d'erreur, plan reste "free" |
| F07-04 | L'artisan annule son abonnement | Confirmation, accès maintenu jusqu'à fin de période, puis retour à "free" |
| F07-05 | Renouvellement automatique réussi | Plan reste actif, aucune action requise |
| F07-06 | Renouvellement échoue (carte expirée) | Email Stripe automatique, 3 tentatives, puis plan passe à "free" |

---

### F08 — Rapport mensuel (anti-churn)

**Description** : Chaque mois, l'artisan reçoit un email récapitulatif de la valeur apportée par RepView.

**Contenu de l'email** :
- Nombre d'avis collectés ce mois
- Note moyenne du mois
- Nombre d'avis négatifs interceptés (notes < 4 non envoyées vers Google)
- Estimation de la note sans RepView vs avec RepView
- Appel à l'action : "Continuez à protéger votre réputation"

**Règles** :
- Envoyé le 1er de chaque mois
- Uniquement aux abonnés actifs (pro ou annual)
- Déclenché par une Cloud Function planifiée (cron)

**Cas d'usage** :
| # | Action | Résultat attendu |
|---|--------|-----------------|
| F08-01 | Le 1er du mois, l'artisan abonné a eu 15 avis dont 3 négatifs | Email envoyé : "15 avis collectés, 3 avis négatifs interceptés. Sans RepView, votre note serait de X.X" |
| F08-02 | L'artisan n'est pas abonné | Pas d'email envoyé |

---

## 4. Navigation

```
Connexion (LoginScreen)
    │
    ▼
┌── Onglets ──────────────────────────────┐
│                                          │
│  📊 Dashboard    📲 Envoyer    📋 Historique  │
│                                          │
│  (DashboardScreen) (SendScreen) (HistoryScreen) │
│                                          │
└──────────────────────────────────────────┘
    │
    └── ⚙️ Paramètres (depuis Dashboard)
            ├── Profil (ProfileScreen)
            └── Abonnement (SubscriptionScreen)
```

---

## 5. Règles métier transversales

| Règle | Description |
|-------|-------------|
| RG01 | Un artisan sans plan actif peut voir le dashboard mais ne peut pas envoyer de SMS |
| RG02 | Un lien de notation est à usage unique |
| RG03 | Les notes < 4 ne sont jamais redirigées vers Google |
| RG04 | Les numéros de téléphone ne sont jamais stockés en clair (hash SHA-256) |
| RG05 | Les données de l'artisan ne sont accessibles qu'à lui (isolation par uid) |
| RG06 | Le contenu du SMS est non modifiable par l'artisan dans le MVP |
| RG07 | Pas de relance automatique dans le MVP |
| RG08 | L'app fonctionne en français uniquement dans le MVP |
