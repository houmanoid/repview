const { setGlobalOptions } = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const twilio = require('twilio');

initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10 });

// ── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin(uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists || snap.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
  }
}

// ── SMS ───────────────────────────────────────────────────────────────────────

exports.sendSMS = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise.');
  }

  const uid = request.auth.uid;
  const { clientName = 'Cher client', phoneNumber } = request.data;

  if (!phoneNumber) {
    throw new HttpsError('invalid-argument', 'Numéro de téléphone requis.');
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Utilisateur introuvable.');
  }
  if (userDoc.data().plan === 'free') {
    throw new HttpsError('permission-denied', 'Abonnement requis pour envoyer des SMS.');
  }

  const phoneHash = crypto.createHash('sha256').update(phoneNumber).digest('hex');
  const phoneLast4 = phoneNumber.replace(/\D/g, '').slice(-4);

  // Un seul avis par client — on utilise le hash comme ID de document
  const requestRef = db
    .collection('users').doc(uid)
    .collection('requests').doc(phoneHash);

  await requestRef.set({
    clientName,
    phoneHash,
    phoneLast4,
    status: 'sent',
    sentAt: FieldValue.serverTimestamp(),
    ratedAt: null,
    rating: null,
  }, { merge: true });

  const requestId = phoneHash;
  const ratingUrl = `https://repview.web.app/rate?id=${requestId}&u=${uid}`;
  const smsBody =
    `${clientName}, merci pour votre confiance ! ` +
    `Donnez-nous votre avis en 10 secondes 👉 ${ratingUrl}\n` +
    `STOP au ${process.env.TWILIO_PHONE_NUMBER}`;

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  try {
    await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw new HttpsError('internal', "Échec de l'envoi du SMS. Veuillez réessayer.");
  }

  return { success: true, requestId };
});

// ── Admin : créer un commerçant ───────────────────────────────────────────────

exports.adminCreateMerchant = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  await assertAdmin(request.auth.uid);

  const { email, password, businessName, plan = 'free', baseline } = request.data;

  if (!email || !password || !businessName) {
    throw new HttpsError('invalid-argument', 'Champs obligatoires manquants.');
  }

  let userRecord;
  try {
    userRecord = await getAuth().createUser({ email, password });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Cet email est déjà utilisé.');
    }
    throw new HttpsError('internal', 'Erreur lors de la création du compte.');
  }

  await db.collection('users').doc(userRecord.uid).set({
    email,
    businessName,
    plan,
    role: 'merchant',
    googleReviewUrl: '',
    stripeCustomerId: '',
    disabled: false,
    baseline: baseline || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid };
});

// ── Admin : modifier un commerçant ───────────────────────────────────────────

exports.adminUpdateMerchant = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  await assertAdmin(request.auth.uid);

  const { uid, plan, disabled } = request.data;
  if (!uid) throw new HttpsError('invalid-argument', 'UID requis.');

  const updates = { updatedAt: FieldValue.serverTimestamp() };

  if (plan !== undefined) updates.plan = plan;

  if (disabled !== undefined) {
    updates.disabled = disabled;
    await getAuth().updateUser(uid, { disabled });
  }

  await db.collection('users').doc(uid).update(updates);
  return { success: true };
});
