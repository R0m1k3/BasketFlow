import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/admin/config');
      const geminiConfig = response.data.find(c => c.key === 'GEMINI_API_KEY');
      const geminiEnabledConfig = response.data.find(c => c.key === 'SOURCE_GEMINI_ENABLED');
      
      setGeminiKey(geminiConfig?.value || '');
      setGeminiEnabled(geminiEnabledConfig?.value !== 'false');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveGemini = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/GEMINI_API_KEY', {
        value: geminiKey,
        description: 'Clé API pour Gemini AI avec Google Search'
      });
      setMessage('✅ Clé Gemini sauvegardée');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSource = async (sourceName, isEnabled) => {
    try {
      await axios.put(`/api/admin/config/SOURCE_${sourceName}_ENABLED`, {
        value: isEnabled ? 'true' : 'false',
        description: `Activer/désactiver la source ${sourceName}`
      });
      setMessage(`✅ Source ${sourceName} ${isEnabled ? 'activée' : 'désactivée'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la modification');
      fetchConfig(); // Reset state on error
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage('');
    setTestResult(null);
    
    try {
      const response = await axios.post('/api/admin/update-now');
      setTestResult(response.data);
      setMessage('✅ Test réussi ! Matchs mis à jour.');
    } catch (error) {
      setTestResult(null);
      setMessage(error.response?.data?.error || '❌ Erreur lors du test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content">
      {message && <div className="admin-message">{message}</div>}

      <div className="config-section">
        <h3>🏀 Source de données : Gemini AI avec Google Search</h3>
        <p className="config-description">
          Gemini recherche sur Google les calendriers officiels (NBA.com, Euroleague.net, LNB.fr) et génère automatiquement tous les matchs programmés avec les diffuseurs français.
        </p>
      </div>

      <div className="config-section">
        <h3>
          🤖 Gemini AI (Matchs + Diffuseurs)
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={geminiEnabled}
              onChange={(e) => {
                setGeminiEnabled(e.target.checked);
                handleToggleSource('GEMINI', e.target.checked);
              }}
            />
            <span className="slider"></span>
          </label>
        </h3>
        <p className="config-description">
          Intelligence artificielle avec recherche Google. Trouve TOUS les matchs programmés et ajoute automatiquement les diffuseurs français (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN, etc.).
          <br />
          <strong>Couverture complète :</strong> NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL
          <br />
          <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">
            Obtenir une clé API Gemini (gratuit) →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API Gemini</label>
          <input
            type="text"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Votre clé API Gemini..."
            className="api-key-input"
            disabled={!geminiEnabled}
          />
          <button 
            onClick={handleSaveGemini} 
            disabled={loading || !geminiEnabled}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <div className="form-group">
          <button 
            onClick={handleTestConnection} 
            disabled={loading}
            className="btn-test"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? '⏳ Mise à jour en cours...' : '🚀 Mettre à jour les matchs'}
          </button>
        </div>

        {testResult && testResult.success && (
          <div className="test-result">
            <h4>✅ Mise à jour réussie</h4>
            <p><strong>Matchs mis à jour :</strong> {testResult.matchesUpdated || 0}</p>
            <p>Les matchs devraient apparaître dans la vue principale.</p>
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>📖 Guide d'utilisation</h3>
        <ol className="usage-guide">
          <li>Obtenez une clé API Gemini sur <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI Studio</a> (gratuit)</li>
          <li>Collez la clé ci-dessus et cliquez sur "Sauvegarder"</li>
          <li>Cliquez sur "Mettre à jour les matchs" pour lancer la recherche Gemini</li>
          <li>Gemini va rechercher sur Google les calendriers officiels et générer tous les matchs</li>
          <li>Les matchs seront automatiquement mis à jour tous les jours à 6h00</li>
        </ol>
        
        <div className="info-box">
          <h4>🎯 Fonctionnement intelligent :</h4>
          <ul>
            <li><strong>Recherche Google :</strong> Gemini cherche les calendriers officiels (NBA.com, Euroleague.net, LNB.fr, etc.)</li>
            <li><strong>Génération de matchs :</strong> Création automatique des matchs programmés avec dates/équipes exactes</li>
            <li><strong>Diffuseurs français :</strong> Ajout automatique des chaînes TV (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN)</li>
            <li><strong>Couverture complète :</strong> NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL</li>
          </ul>
        </div>

        <div className="info-box">
          <h4>📺 Diffuseurs français détectés :</h4>
          <ul>
            <li><strong>NBA :</strong> beIN Sports, Prime Video, NBA League Pass</li>
            <li><strong>WNBA :</strong> NBA League Pass, beIN Sports</li>
            <li><strong>Euroleague :</strong> SKWEEK, La Chaîne L'Équipe, TV Monaco</li>
            <li><strong>Betclic Elite :</strong> beIN Sports, La Chaîne L'Équipe, DAZN</li>
            <li><strong>EuroCup :</strong> SKWEEK, EuroLeague TV</li>
            <li><strong>BCL :</strong> Courtside 1891</li>
          </ul>
        </div>

        <div className="info-box success">
          ✅ <strong>Gemini AI :</strong> API gratuite avec quota généreux (Google AI Studio). Pas besoin de payer pour BasketAPI ou autres services RapidAPI !
        </div>
      </div>
    </div>
  );
}

export default ApiBasketballConfig;
