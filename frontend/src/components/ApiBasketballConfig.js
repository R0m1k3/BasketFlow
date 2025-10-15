import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [basketballDataKey, setBasketballDataKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [basketballDataEnabled, setBasketballDataEnabled] = useState(true);
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
      const basketballDataConfig = response.data.find(c => c.key === 'BASKETBALL_DATA_KEY');
      const geminiConfig = response.data.find(c => c.key === 'GEMINI_API_KEY');
      
      const basketballDataEnabledConfig = response.data.find(c => c.key === 'SOURCE_BASKETBALL_DATA_ENABLED');
      const geminiEnabledConfig = response.data.find(c => c.key === 'SOURCE_GEMINI_ENABLED');
      
      setBasketballDataKey(basketballDataConfig?.value || '');
      setGeminiKey(geminiConfig?.value || '');
      
      setBasketballDataEnabled(basketballDataEnabledConfig?.value !== 'false');
      setGeminiEnabled(geminiEnabledConfig?.value !== 'false');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveBasketballData = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/BASKETBALL_DATA_KEY', {
        value: basketballDataKey,
        description: 'Clé API pour Basketball Data (BroadageSports sur RapidAPI)'
      });
      setMessage('✅ Clé Basketball Data sauvegardée');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
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
        <h3>🏀 Sources de données optimisées</h3>
        <p className="config-description">
          Basketball Data récupère les matchs et scores en temps réel. Gemini enrichit ensuite avec les diffuseurs français.
        </p>
      </div>

      <div className="config-section">
        <h3>
          📊 Source 1 : Basketball Data API
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={basketballDataEnabled}
              onChange={(e) => {
                setBasketballDataEnabled(e.target.checked);
                handleToggleSource('BASKETBALL_DATA', e.target.checked);
              }}
            />
            <span className="slider"></span>
          </label>
        </h3>
        <p className="config-description">
          Couvre 100+ tournois : NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL. Live scores avec mise à jour toutes les 15 secondes.
          <br />
          <a href="https://rapidapi.com/BroadageSports/api/basketball-data" target="_blank" rel="noopener noreferrer">
            S'inscrire sur RapidAPI (Basketball Data) →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API RapidAPI (Basketball Data)</label>
          <input
            type="text"
            value={basketballDataKey}
            onChange={(e) => setBasketballDataKey(e.target.value)}
            placeholder="Votre clé RapidAPI..."
            className="api-key-input"
            disabled={!basketballDataEnabled}
          />
          <button 
            onClick={handleSaveBasketballData} 
            disabled={loading || !basketballDataEnabled}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>
          🤖 Source 2 : Gemini AI (Enrichissement)
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
          Intelligence artificielle avec recherche Google. Enrichit les matchs avec les diffuseurs français (beIN Sports, Prime Video, SKWEEK, etc.).
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
            {loading ? '⏳ Mise à jour en cours...' : '🚀 Mettre à jour les matchs (toutes sources)'}
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
          <li>Créez un compte sur <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer">RapidAPI</a></li>
          <li>Abonnez-vous à <a href="https://rapidapi.com/BroadageSports/api/basketball-data" target="_blank" rel="noopener noreferrer">Basketball Data</a> (plan gratuit disponible)</li>
          <li>Copiez votre clé API RapidAPI</li>
          <li>Collez la clé ci-dessus et cliquez sur "Sauvegarder"</li>
          <li>Optionnel : Ajoutez une clé Gemini pour enrichir avec les diffuseurs français</li>
          <li>Cliquez sur "Mettre à jour les matchs" pour tester</li>
          <li>Les matchs seront automatiquement mis à jour tous les jours à 6h00</li>
        </ol>
        
        <div className="info-box">
          <h4>🎯 Fonctionnement :</h4>
          <ul>
            <li><strong>Basketball Data :</strong> Récupère les matchs et scores en temps réel pour 100+ tournois</li>
            <li><strong>Gemini AI :</strong> Enrichit automatiquement avec les diffuseurs français (beIN Sports, Prime Video, SKWEEK, etc.)</li>
            <li><strong>Affichage :</strong> Les scores des matchs terminés/en cours s'affichent automatiquement</li>
          </ul>
        </div>

        <div className="info-box">
          <h4>📺 Diffuseurs français :</h4>
          <ul>
            <li><strong>NBA :</strong> beIN Sports, Prime Video, NBA League Pass</li>
            <li><strong>WNBA :</strong> NBA League Pass, beIN Sports</li>
            <li><strong>Euroleague :</strong> SKWEEK, La Chaîne L'Équipe, TV Monaco</li>
            <li><strong>Betclic Elite :</strong> beIN Sports, La Chaîne L'Équipe, DAZN</li>
            <li><strong>EuroCup :</strong> SKWEEK, EuroLeague TV</li>
            <li><strong>BCL :</strong> Courtside 1891</li>
          </ul>
        </div>

        <div className="warning-box">
          ⚠️ <strong>Plan gratuit :</strong> Basketball Data offre un plan gratuit avec quotas limités.
        </div>
      </div>
    </div>
  );
}

export default ApiBasketballConfig;
