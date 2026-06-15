# RepView — MVP

## Ce que fait l'app
App mobile React Native (Expo) pour artisans.
L'artisan saisit le numéro d'un client, un SMS part automatiquement,
le client note de 1 à 5 étoiles sur une page web,
la note remonte dans le dashboard de l'artisan.
Si note >= 4, le client est redirigé vers Google Reviews.

## Stack technique
- Mobile : React Native + Expo
- Backend : Firebase (Firestore + Cloud Functions + Auth + Hosting)
- SMS : Twilio
- Paiement : Stripe (abonnement 9€/mois)
- Pas de serveur custom, tout Firebase

## Structure
/app → code React Native (Expo)
/functions → Cloud Functions Firebase
/web → page de notation client (HTML hébergé sur Firebase Hosting)

## Règles
- Tout en français dans l'UI
- RGPD : ne jamais stocker de numéro de téléphone en clair
- Design sombre, épuré, mobile-first
- Minimum de dépendances