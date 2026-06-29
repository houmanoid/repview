import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import AddMerchantModal from '../components/AddMerchantModal';

function Stars({ rating }) {
  if (!rating) return <span style={{ color: '#333' }}>—</span>;
  const full = Math.round(rating);
  return (
    <span>
      <span className="stars">
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span className="stars-count">{rating.toFixed(1)}</span>
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const totalPro = merchants.filter(m => m.plan === 'pro').length;
  const totalFree = merchants.filter(m => m.plan !== 'pro').length;
  const newThisMonth = merchants.filter(m => {
    if (!m.createdAt) return false;
    const d = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  function planBadge(m) {
    if (m.disabled) return <span className="badge badge-disabled">Désactivé</span>;
    if (m.plan === 'pro') return <span className="badge badge-pro">Pro</span>;
    return <span className="badge badge-free">Gratuit</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Commerçants</div>
          <div className="page-subtitle">
            {merchants.length} établissement{merchants.length !== 1 ? 's' : ''} enregistré{merchants.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Ajouter
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{merchants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Abonnés Pro</div>
          <div className="stat-value" style={{ color: '#4ade80' }}>{totalPro}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plan Gratuit</div>
          <div className="stat-value" style={{ color: '#888' }}>{totalFree}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nouveaux ce mois</div>
          <div className="stat-value" style={{ color: '#4f6ef7' }}>{newThisMonth}</div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : merchants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <div className="empty-state-text">Aucun commerçant pour l'instant.<br />Ajoutez le premier !</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Commerce</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Baseline</th>
                <th>Inscription</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {merchants.map(m => (
                <tr key={m.id} onClick={() => navigate(`/commercants/${m.id}`)}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{m.businessName || '—'}</td>
                  <td>
                    <span className="truncate" style={{ color: '#666', display: 'block', maxWidth: '200px' }}>
                      {m.email}
                    </span>
                  </td>
                  <td>{planBadge(m)}</td>
                  <td>
                    <Stars rating={m.baseline?.rating} />
                    {m.baseline?.reviewCount > 0 && (
                      <span style={{ color: '#444', fontSize: '11px', marginLeft: '6px' }}>
                        ({m.baseline.reviewCount})
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#555' }}>{formatDate(m.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/commercants/${m.id}`); }}
                    >
                      Voir →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddMerchantModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
