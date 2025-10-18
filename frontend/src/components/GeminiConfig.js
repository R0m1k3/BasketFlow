import React, { useState, useEffect } from 'react';
import api from '../api/config';
import './AdminPanel.css';

function GeminiConfig() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/admin/config/GEMINI_API_KEY');
      if (response.data && response.data.value) {
        setIsConfigured(true);
        setApiKey('••••••••••••••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Error fetching Gemini config:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey.startsWith('••••')) {
      setMessage('❌ Veuillez entrer une clé API valide');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/admin/config', {
        key: 'GEMINI_API_KEY',
        value: apiKey,
        description: 'Clé API Google Gemini pour extraction de données'
      });

      setMessage('✅ Configuration Gemini sauvegardée');
      setIsConfigured(true);
      setTimeout(() => {
        setMessage('');
        setApiKey('••••••••••••••••••••••••••••••••');
      }, 2000);
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    setIsConfigured(false);
  };

  return (
    <div className="admin-content">
      {message && <div className="admin-message">{message}</div>}

      <div className="config-section">
        <h3>🤖 Configuration Google Gemini AI</h3>
        <p className="config-description">
          L'API Gemini est utilisée pour extraire les données des matchs de Betclic Elite 
          et enrichir automatiquement les informations de diffusion.
        </p>
      </div>

      <div className="config-section">
        <h3>🔑 Clé API Gemini</h3>
        <div className="form-group">
          <label htmlFor="gemini-key">Clé API :</label>
          <input
            id="gemini-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="config-input"
            disabled={loading}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            {isConfigured ? (
              <span style={{ color: '#28a745' }}>✅ Clé API configurée</span>
            ) : (
              <span>Obtenez votre clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></span>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <button 
            onClick={handleSave} 
            disabled={loading || !apiKey || apiKey === ''}
            className="btn-test"
            style={{ marginRight: '10px' }}
          >
            {loading ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          {isConfigured && (
            <button 
              onClick={handleClear}
              className="btn-delete"
            >
              🔄 Modifier la clé
            </button>
          )}
        </div>
      </div>

      <div className="config-section">
        <h3>ℹ️ Utilisation</h3>
        <div className="info-box">
          <p>Gemini AI est utilisé pour :</p>
          <ul>
            <li>Extraire automatiquement les matchs de Betclic Elite depuis TheSportsDB</li>
            <li>Enrichir les données de diffusion avec les chaînes TV</li>
            <li>Traiter les informations non structurées</li>
          </ul>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            <strong>Note :</strong> L'API Gemini offre un quota gratuit généreux 
            (15 requêtes par minute, 1500 par jour).
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeminiConfig;
