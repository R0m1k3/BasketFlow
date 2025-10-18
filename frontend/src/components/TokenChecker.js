import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';

/**
 * Composant qui vérifie automatiquement la validité du token au chargement
 * et redirige vers login si le token est invalide
 */
function TokenChecker() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        return;
      }

      try {
        // Tente de vérifier le token
        await api.get('/auth/me');
      } catch (error) {
        // Token invalide détecté
        console.log('Token invalide détecté au chargement, nettoyage automatique...');
        localStorage.removeItem('token');
        logout();
        navigate('/login');
      }
    };

    checkToken();
  }, [token, logout, navigate]);

  return null; // Ce composant ne rend rien
}

export default TokenChecker;
