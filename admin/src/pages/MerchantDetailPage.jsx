import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.round(rating);
  return (
    <span>
      <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="stars-count">{rating.toFixed(1)}</span>
    </span>
  );
}

function RatingBar({ rating }) {
  const pct = ((rating - 1) / 4) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '18px', minWidth: '32px' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function MerchantDetailPage() {
  const { uid } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) setMerchant({ id: snap.id, ...snap.data() });

      const q = query(
        collection(db, 'users', uid, 'requests'),
        orderBy('sentAt', 'desc')
      );
      const reqSnap = await getDocs(q);
      setReviews(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.rating));
      setLoading(false);
    }
    load();
  }, [uid]);

  async function callUpdate(data) {
    setUpdating(true);
    setError('');
    try {
      const fn = httpsCallable(functions, 'adminUpdateMerchant');
      await fn({ uid, ...data });
      setMerchant(prev => ({ ...prev, ...data }));
    } catch (e) {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!merchant) return <div style={{ color: '#666', padding: '40px' }}>Commerçant introuvable.</div>;

  const ratedReviews = reviews.filter(r => r.rating);
  const avgRating = ratedReviews.length > 0
    ? ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length
    : null;

  const progression = avgRating && merchant.baseline?.rating
    ? (avgRating - merchant.baseline.rating).toFixed(1)
    : null;

  return (
    <div>
      <Link to="/" className="detail-back">← Retour à la liste</Link>

      <div className="page-header">
        <div>
          <div className="page-title">{merchant.businessName}</div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${merchant.plan === 'pro' ? 'badge-pro' : merchant.disabled ? 'badge-disabled' : 'badge-free'}`}>
              {merchant.disabled ? 'Désactivé' : merchant.plan === 'pro' ? 'Pro' : 'Gratuit'}
            </span>
          </div>
        </div>
        <div className="actions-bar">
          {merchant.plan === 'pro' ? (
            <button className="btn btn-secondary" disabled={updating} onClick={() => callUpdate({ plan: 'free' })}>
              Passer en Gratuit
            </button>
          ) : (
            <button className="btn btn-primary" disabled={updating} onClick={() => callUpdate({ plan: 'pro' })}>
              Passer en Pro
            </button>
          )}
          <button
            className={`btn ${merchant.disabled ? 'btn-primary' : 'btn-danger'}`}
            disabled={updating}
            onClick={() => callUpdate({ disabled: !merchant.disabled })}
          >
            {merchant.disabled ? 'Réactiver' : 'Désactiver'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="detail-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Informations</div>
          <div className="detail-field">
            <div className="detail-field-label">Email</div>
            <div className="detail-field-value">{merchant.email}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Date d'inscription</div>
            <div className="detail-field-value">{formatDate(merchant.createdAt)}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">URL Google Reviews</div>
            <div className="detail-field-value" style={{ color: merchant.googleReviewUrl ? '#4f6ef7' : '#333' }}>
              {merchant.googleReviewUrl || 'Non renseignée'}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Statistiques RepView</div>
          <div className="detail-field">
            <div className="detail-field-label">Avis reçus via RepView</div>
            <div className="detail-field-value">{ratedReviews.length}</div>
          </div>
          {avgRating ? (
            <div className="detail-field">
              <div className="detail-field-label">Note moyenne</div>
              <RatingBar rating={avgRating} />
            </div>
          ) : (
            <div className="detail-field">
              <div className="detail-field-label">Note moyenne</div>
              <div className="detail-field-value" style={{ color: '#333' }}>Aucun avis pour l'instant</div>
            </div>
          )}
          {progression !== null && (
            <div className="detail-field">
              <div className="detail-field-label">Progression vs baseline</div>
              <div className="detail-field-value" style={{ color: parseFloat(progression) >= 0 ? '#4ade80' : '#f87171' }}>
                {parseFloat(progression) >= 0 ? '+' : ''}{progression} pts
              </div>
            </div>
          )}
        </div>
      </div>

      {merchant.baseline && (
        <div className="card">
          <div className="card-title">Baseline à l'inscription</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="detail-field" style={{ marginBottom: 0 }}>
              <div className="detail-field-label">Note</div>
              <div className="detail-field-value">
                <Stars rating={merchant.baseline.rating} />
              </div>
            </div>
            <div className="detail-field" style={{ marginBottom: 0 }}>
              <div className="detail-field-label">Nombre d'avis</div>
              <div className="detail-field-value">{merchant.baseline.reviewCount || '—'}</div>
            </div>
            <div className="detail-field" style={{ marginBottom: 0 }}>
              <div className="detail-field-label">Capturé le</div>
              <div className="detail-field-value">
                {merchant.baseline.snapshotAt
                  ? new Date(merchant.baseline.snapshotAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>Avis reçus</span>
          <span style={{ color: '#444', fontSize: '13px' }}>{ratedReviews.length} avis</span>
        </div>
        {ratedReviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⭐</div>
            <div className="empty-state-text">Aucun avis reçu via RepView pour l'instant.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Note</th>
                <th>Date</th>
                <th>Redirection Google</th>
              </tr>
            </thead>
            <tbody>
              {ratedReviews.map(r => (
                <tr key={r.id}>
                  <td style={{ color: '#555', fontFamily: 'monospace', fontSize: '13px' }}>
                    ••••&nbsp;{r.phoneLast4}
                  </td>
                  <td><Stars rating={r.rating} /></td>
                  <td style={{ color: '#555' }}>{formatDate(r.ratedAt)}</td>
                  <td>
                    <span className={`badge ${r.rating >= 4 ? 'badge-pro' : 'badge-free'}`}>
                      {r.rating >= 4 ? 'Oui' : 'Non'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
