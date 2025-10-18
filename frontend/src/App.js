import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import './App.css';

// Vérification et nettoyage automatique du token au démarrage
function TokenCleaner() {
  useEffect(() => {
    const checkAndCleanToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Vérifier si le token est valide
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.log('🔄 Token invalide détecté, nettoyage automatique...');
          localStorage.removeItem('token');
          // Recharger la page pour appliquer le changement
          window.location.reload();
        }
      } catch (error) {
        console.log('🔄 Erreur de vérification token, nettoyage...');
        localStorage.removeItem('token');
        window.location.reload();
      }
    };

    checkAndCleanToken();
  }, []);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TokenCleaner />
        <div className="App">
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <footer className="App-footer">
            <p>Mise à jour quotidienne à 6h00 | Données fournies par 3 sources gratuites</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
