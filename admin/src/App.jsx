import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './pages/LoginPage';
import MerchantsPage from './pages/MerchantsPage';
import MerchantDetailPage from './pages/MerchantDetailPage';
import Layout from './components/Layout';

function ProtectedRoute({ user, children }) {
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        return;
      }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists() && snap.data().role === 'admin') {
        setUser(u);
      } else {
        await auth.signOut();
        setUser(null);
      }
    });
  }, []);

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} />
          </ProtectedRoute>
        }
      >
        <Route index element={<MerchantsPage />} />
        <Route path="commercants/:uid" element={<MerchantDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
