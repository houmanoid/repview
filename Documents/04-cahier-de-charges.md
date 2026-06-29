# RepView — Cahier de charges

> Version : 1.0
> Dernière mise à jour : 14 juin 2026
> Statut : En cours de développement
> Destinataires : développeur, juriste, avocat

---

## 1. Présentation du projet

### 1.1 Objet

RepView est une application mobile permettant aux professionnels (artisans, commerçants, professions libérales) de collecter des avis de satisfaction de leurs clients par SMS, et de les orienter vers la publication d'un avis sur Google Reviews lorsque la note est favorable.

### 1.2 Éditeur

À compléter :
- Raison sociale :
- Forme juridique :
- SIRET :
- Adresse du siège :
- Responsable légal :
- Contact DPO (si applicable) :

### 1.3 Périmètre géographique

- Lancement initial : France métropolitaine
- Extension prévue : DOM-TOM, Belgique, Suisse, Canada francophone

---

## 2. Description fonctionnelle du service

### 2.1 Ce que fait le service

- L'artisan s'inscrit via email et mot de passe
- L'artisan saisit le nom et le numéro de téléphone d'un client
- Un SMS est envoyé au client contenant un lien vers une page de notation
- Le client note la prestation de 1 à 5
- Si la note est supérieure ou égale à 4, le client est invité à laisser un avis sur Google Reviews via un bouton optionnel
- Si la note est inférieure à 4, le client voit un message de remerciement sans redirection vers Google
- L'artisan voit les résultats dans un tableau de bord mobile

### 2.2 Ce que le service ne fait PAS

- Le service ne publie pas d'avis au nom du client
- Le service ne modifie pas les avis existants sur Google
- Le service ne génère pas de faux avis
- Le service ne contacte pas le client sans action préalable de l'artisan
- Le service ne stocke pas les numéros de téléphone des clients en clair
- Le service ne revend pas les données collectées à des tiers

---

## 3. Conformité RGPD

### 3.1 Données personnelles collectées

| Donnée | Personne concernée | Base légale | Durée de conservation |
|--------|-------------------|-------------|----------------------|
| Email | Artisan | Contrat (exécution du service) | Durée du compte + 3 ans |
| Mot de passe | Artisan | Contrat | Hashé par Firebase Auth, non réversible |
| Nom du commerce | Artisan | Contrat | Durée du compte + 3 ans |
| Nom du client | Client final | Intérêt légitime de l'artisan | 12 mois après la collecte |
| Numéro de téléphone du client | Client final | Intérêt légitime de l'artisan | Non stocké (hashé immédiatement, hash conservé 12 mois) |
| Note de satisfaction (1-5) | Client final | Intérêt légitime de l'artisan | 24 mois |
| Données de paiement (carte) | Artisan | Contrat | Gérées exclusivement par Stripe, non stockées par RepView |

### 3.2 Sous-traitants et transferts de données

| Sous-traitant | Pays | Données traitées | Garanties |
|---------------|------|-----------------|-----------|
| Google (Firebase) | USA/EU | Toutes les données applicatives | Clauses contractuelles types, chiffrement |
| Twilio | USA | Numéro de téléphone du client (pour envoi SMS) | Clauses contractuelles types |
| Stripe | USA/EU | Données de paiement de l'artisan | Certifié PCI DSS niveau 1 |

### 3.3 Droits des personnes

**Artisan (utilisateur inscrit)** :
- Droit d'accès : peut consulter toutes ses données dans l'app
- Droit de rectification : peut modifier son profil dans l'app
- Droit de suppression : peut demander la suppression de son compte (email au DPO)
- Droit à la portabilité : export des données sur demande

**Client final (non inscrit)** :
- Informé via le SMS que ses données sont traitées (lien vers la politique de confidentialité dans la page de notation)
- Droit d'opposition : peut demander la suppression de sa note et de son hash via contact DPO
- Pas de création de compte, pas de tracking, pas de cookies

### 3.4 Mesures de sécurité

- Chiffrement en transit : TLS 1.3 sur toutes les communications
- Chiffrement au repos : Firestore chiffré par défaut (Google Cloud)
- Hashage des numéros de téléphone : SHA-256, irréversible
- Isolation des données : chaque artisan n'accède qu'à ses propres données
- Authentification : tokens JWT signés, expiration 1 heure
- Secrets API : stockés dans les variables d'environnement, jamais dans le code source

### 3.5 Registre des traitements

| Traitement | Finalité | Base légale | Catégories de données |
|-----------|----------|-------------|----------------------|
| Gestion des comptes artisans | Fournir le service | Contrat | Email, nom commerce |
| Envoi de SMS aux clients | Collecter des avis | Intérêt légitime | Numéro de téléphone (non conservé) |
| Collecte des notes | Mesurer la satisfaction | Intérêt légitime | Nom client, note |
| Facturation | Gestion des abonnements | Contrat | Données de paiement (via Stripe) |
| Rapport mensuel | Fidélisation | Intérêt légitime | Données agrégées uniquement |

---

## 4. Conformité e-commerce et consommation

### 4.1 Conditions générales de vente (CGV)

À rédiger par le juriste. Doivent couvrir :
- Description du service
- Prix et modalités de paiement
- Durée de l'abonnement et renouvellement automatique
- Conditions de résiliation
- Droit de rétractation (14 jours, applicable aux services numériques sous conditions)
- Limitation de responsabilité
- Loi applicable et juridiction compétente

### 4.2 Conditions générales d'utilisation (CGU)

À rédiger par le juriste. Doivent couvrir :
- Usage acceptable du service
- Interdiction de générer de faux avis
- Responsabilité de l'artisan quant au consentement du client à recevoir le SMS
- Propriété intellectuelle
- Suspension et résiliation du compte

### 4.3 Mentions légales

Obligatoires sur le site web et dans l'app :
- Identité de l'éditeur (nom, adresse, SIRET)
- Directeur de la publication
- Hébergeur (Google Firebase / Google Cloud)
- Contact

### 4.4 Politique de confidentialité

Obligatoire, accessible depuis :
- L'app mobile (écran paramètres)
- La page de notation client
- Le site web / landing page

Doit contenir :
- Identité du responsable de traitement
- Données collectées et finalités
- Base légale de chaque traitement
- Durée de conservation
- Sous-traitants et transferts hors UE
- Droits des personnes et modalités d'exercice
- Contact DPO

---

## 5. Réglementation SMS

### 5.1 Cadre légal

L'envoi de SMS est soumis à la réglementation suivante :
- **RGPD** (Règlement Général sur la Protection des Données) : le numéro de téléphone est une donnée personnelle
- **Directive ePrivacy** (transposée en droit français par l'article L.34-5 du CPCE) : encadre la prospection commerciale par voie électronique
- **CNIL — recommandations sur la prospection commerciale** : consentement ou intérêt légitime selon le contexte

### 5.2 Qualification du SMS RepView

Le SMS envoyé par RepView n'est **pas de la prospection commerciale**. C'est une demande de retour d'expérience post-prestation, assimilable à une enquête de satisfaction dans le cadre de la relation client existante.

**Justification** :
- Le SMS est envoyé après une prestation effective (relation contractuelle existante)
- Le contenu ne contient aucune offre commerciale ni promotion
- Le SMS est envoyé une seule fois par prestation (pas de relance automatique)
- L'artisan est responsable de l'envoi (il déclenche manuellement chaque SMS)

### 5.3 Obligations de l'artisan

L'artisan utilisant RepView est informé (via les CGU) qu'il est responsable de :
- S'assurer que le client a eu une prestation effective avant l'envoi
- Ne pas envoyer de SMS à des personnes n'ayant pas été clientes
- Respecter les demandes de désinscription (opt-out)

### 5.4 Mention STOP SMS

Le SMS doit contenir une mention permettant au destinataire de s'opposer à de futurs envois. Format recommandé par la CNIL :

```
STOP au {numéro}
```

À intégrer en fin de SMS ou via un lien de désinscription sur la page de notation.

---

## 6. Avis en ligne — Conformité

### 6.1 Cadre légal

La collecte et la publication d'avis en ligne sont encadrées par :
- **Article L.111-7-2 du Code de la consommation** : obligations de transparence pour les plateformes publiant des avis
- **Directive Omnibus (2019/2161)** : renforcement des obligations sur les avis en ligne
- **Norme NF ISO 20488** (anciennement NF Z74-501) : norme volontaire sur les avis en ligne

### 6.2 Qualification de RepView

RepView **ne publie pas d'avis**. L'application collecte des notes de satisfaction en interne et redirige le client vers Google Reviews s'il le souhaite. Le client est libre de publier ou non un avis sur Google.

RepView n'est donc **pas une plateforme d'avis** au sens de l'article L.111-7-2 du Code de la consommation.

### 6.3 Points de vigilance

| Risque | Mesure |
|--------|--------|
| Accusation de filtrage d'avis | RepView ne publie aucun avis. Le filtrage concerne la redirection vers Google, pas la publication. Le client peut aller sur Google indépendamment. |
| Faux avis | Les CGU interdisent à l'artisan d'envoyer des SMS à des non-clients. RepView ne génère ni ne rédige d'avis. |
| Manipulation de note Google | Le client reste libre de son choix. Le bouton Google est une invitation, pas une obligation. |

### 6.4 Recommandation juridique

Il est recommandé de faire valider par un avocat spécialisé :
- Que le mécanisme de filtrage (redirection conditionnelle vers Google) ne contrevient pas aux obligations de transparence
- Que les CGU protègent suffisamment l'éditeur contre l'usage abusif par un artisan (faux SMS à des non-clients)
- Que la mention "avis vérifié" n'est jamais utilisée (les avis ne sont pas vérifiés au sens de la norme NF ISO 20488)

---

## 7. Paiement et facturation

### 7.1 Prestataire de paiement

Stripe Payments (Stripe Technology Europe, Ltd — Irlande)
Certifié PCI DSS Niveau 1.
RepView ne collecte, ne stocke et ne traite aucune donnée bancaire. L'ensemble du flux de paiement est délégué à Stripe.

### 7.2 Tarification

| Plan | Prix TTC | Renouvellement | Engagement |
|------|---------|---------------|------------|
| Gratuit | 0 € | — | Aucun |
| Pro mensuel | 9 €/mois | Automatique | Sans engagement |
| Pro annuel | 79 €/an | Automatique | 12 mois |

### 7.3 TVA

- Si l'éditeur est auto-entrepreneur sous le seuil de franchise : TVA non applicable (mention obligatoire sur les factures)
- Si l'éditeur est assujetti à la TVA : TVA applicable à 20 % (service numérique en France)
- Les factures sont générées automatiquement par Stripe et accessibles dans le portail client

### 7.4 Droit de rétractation

Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services numériques dont l'exécution a commencé avec l'accord du consommateur avant l'expiration du délai de rétractation.

L'artisan devra cocher une case confirmant qu'il accepte l'exécution immédiate du service et renonce à son droit de rétractation.

---

## 8. Propriété intellectuelle

### 8.1 Licence

- Le code source de RepView est la propriété exclusive de l'éditeur
- Les données saisies par l'artisan restent sa propriété
- Les notes des clients ne sont pas considérées comme une œuvre protégeable

### 8.2 Marque

- Le nom "RepView" devra faire l'objet d'une recherche d'antériorité auprès de l'INPI avant exploitation commerciale
- Budget estimé dépôt de marque INPI : 190 € (1 classe)

---

## 9. Hébergement et disponibilité

### 9.1 Hébergeur

- Google Cloud Platform (Firebase)
- Localisation des données : Europe (région eur3 — Belgique)
- SLA Firebase : 99.95% de disponibilité

### 9.2 Sauvegarde

- Firestore : sauvegardes automatiques gérées par Google
- Export manuel possible via `gcloud firestore export`
- Pas de plan de sauvegarde custom dans le MVP

### 9.3 Plan de continuité

- En cas d'interruption Firebase : service indisponible (pas de fallback dans le MVP)
- En cas d'interruption Twilio : les SMS ne partent pas, message d'erreur affiché
- En cas d'interruption Stripe : les paiements ne passent pas, Stripe retente automatiquement

---

## 10. Documents à produire (action juriste)

| Document | Priorité | Statut |
|----------|---------|--------|
| Politique de confidentialité | Obligatoire avant lancement | À rédiger |
| Conditions générales d'utilisation (CGU) | Obligatoire avant lancement | À rédiger |
| Conditions générales de vente (CGV) | Obligatoire avant lancement | À rédiger |
| Mentions légales | Obligatoire avant lancement | À rédiger |
| Registre des traitements RGPD | Obligatoire | Ébauche dans ce document (section 3.5) |
| Analyse d'impact (DPIA) | Recommandée | À évaluer avec le DPO |
| Recherche d'antériorité marque | Recommandée avant lancement | À effectuer (INPI) |
| Validation du mécanisme de filtrage d'avis | Recommandée | À soumettre à un avocat |
