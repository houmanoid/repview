import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const INITIAL = {
  businessName: '',
  email: '',
  password: '',
  plan: 'free',
  baselineRating: '',
  baselineReviewCount: '',
};

export default function AddMerchantModal({ onClose }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.businessName.trim() || !form.email || !form.password) {
      setError('Nom du commerce, email et mot de passe sont obligatoires.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (form.baselineRating && (parseFloat(form.baselineRating) < 1 || parseFloat(form.baselineRating) > 5)) {
      setError('La note doit être comprise entre 1 et 5.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      password: form.password,
      plan: form.plan,
    };

    if (form.baselineRating) {
      payload.baseline = {
        rating: parseFloat(form.baselineRating),
        reviewCount: form.baselineReviewCount ? parseInt(form.baselineReviewCount, 10) : 0,
        snapshotAt: new Date().toISOString(),
      };
    }

    try {
      const createMerchant = httpsCallable(functions, 'adminCreateMerchant');
      await createMerchant(payload);
      onClose();
    } catch (e) {
      if (e.message?.includes('already-exists') || e.message?.includes('email-already-exists')) {
        setError('Cet email est déjà utilisé.');
      } else {
        setError(e.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Ajouter un commerçant</div>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">Commerce</div>
            <div className="form-group">
              <label className="form-label">Nom du commerce *</label>
              <input
                className="form-input"
                placeholder="Ex : Plomberie Martin"
                value={form.businessName}
                onChange={set('businessName')}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Plan</label>
              <select className="form-select" value={form.plan} onChange={set('plan')}>
                <option value="free">Gratuit</option>
                <option value="pro">Pro (9 €/mois)</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Accès</div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                placeholder="contact@commerce.fr"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe temporaire *</label>
              <input
                className="form-input"
                type="password"
                placeholder="8 caractères minimum"
                value={form.password}
                onChange={set('password')}
              />
              <div className="form-hint">Le commerçant pourra le modifier dans l'application.</div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Baseline (optionnel)</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Note actuelle (sur 5)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  placeholder="4.2"
                  value={form.baselineRating}
                  onChange={set('baselineRating')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre d'avis existants</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="83"
                  value={form.baselineReviewCount}
                  onChange={set('baselineReviewCount')}
                />
              </div>
            </div>
            <div className="form-hint">Note sur Google (ou autre) au moment de l'inscription.</div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
