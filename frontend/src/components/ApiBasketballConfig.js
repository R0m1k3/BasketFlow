import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [ballDontLieKey, setBallDontLieKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [rapidApiEnabled, setRapidApiEnabled] = useState(true);
  const [ballDontLieEnabled, setBallDontLieEnabled] = useState(true);
  const [euroleagueEnabled, setEuroleagueEnabled] = useState(true);
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
      const rapidApiConfig = response.data.find(c => c.key === 'API_BASKETBALL_KEY');
      const ballDontLieConfig = response.data.find(c => c.key === 'BALLDONTLIE_API_KEY');
      const geminiConfig = response.data.find(c => c.key === 'GEMINI_API_KEY');
      
      const rapidApiEnabledConfig = response.data.find(c => c.key === 'SOURCE_RAPIDAPI_ENABLED');
      const ballDontLieEnabledConfig = response.data.find(c => c.key === 'SOURCE_BALLDONTLIE_ENABLED');
      const euroleagueEnabledConfig = response.data.find(c => c.key === 'SOURCE_EUROLEAGUE_ENABLED');
      const geminiEnabledConfig = response.data.find(c => c.key === 'SOURCE_GEMINI_ENABLED');
      
      setRapidApiKey(rapidApiConfig?.value || '');
      setBallDontLieKey(ballDontLieConfig?.value || '');
      setGeminiKey(geminiConfig?.value || '');
      
      setRapidApiEnabled(rapidApiEnabledConfig?.value !== 'false');
      setBallDontLieEnabled(ballDontLieEnabledConfig?.value !== 'false');
      setEuroleagueEnabled(euroleagueEnabledConfig?.value !== 'false');
      setGeminiEnabled(geminiEnabledConfig?.value !== 'false');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveRapidApi = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/API_BASKETBALL_KEY', {
        value: rapidApiKey,
        description: 'Clé API pour API-Basketball (RapidAPI)'
      });
      setMessage('✅ Clé RapidAPI sauvegardée');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBallDontLie = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/BALLDONTLIE_API_KEY', {
        value: ballDontLieKey,
        description: 'Clé API pour BallDontLie (NBA/WNBA gratuit)'
      });
      setMessage('✅ Clé BallDontLie sauvegardée');
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
        <h3>🏀 Sources de données multiples</h3>
        <p className="config-description">
          L'application utilise 4 sources configurables pour maximiser la couverture des matchs sans doublons. 
          Activez/désactivez les sources selon vos besoins.
        </p>
      </div>

      <div className="config-section">
        <h3>
          📊 Source 1 : RapidAPI (Optionnel)
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={rapidApiEnabled}
              onChange={(e) => {
                setRapidApiEnabled(e.target.checked);
                handleToggleSource('RAPIDAPI', e.target.checked);
              }}
            />
            <span className="slider"></span>
          </label>
        </h3>
        <p className="config-description">
          Couvre NBA, WNBA, Euroleague, Betclic Elite.
          <br />
          <a href="https://rapidapi.com/api-sports/api/api-basketball" target="_blank" rel="noopener noreferrer">
            S'inscrire sur RapidAPI →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API RapidAPI</label>
          <input
            type="text"
            value={rapidApiKey}
            onChange={(e) => setRapidApiKey(e.target.value)}
            placeholder="Votre clé RapidAPI..."
            className="api-key-input"
            disabled={!rapidApiEnabled}
          />
          <button 
            onClick={handleSaveRapidApi} 
            disabled={loading || !rapidApiEnabled}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>
          🆓 Source 2 : BallDontLie (Gratuit)
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={ballDontLieEnabled}
              onChange={(e) => {
                setBallDontLieEnabled(e.target.checked);
                handleToggleSource('BALLDONTLIE', e.target.checked);
              }}
            />
            <span className="slider"></span>
          </label>
        </h3>
        <p className="config-description">
          API gratuite pour NBA et WNBA avec 60 requêtes/minute.
          <br />
          <a href="https://www.balldontlie.io" target="_blank" rel="noopener noreferrer">
            S'inscrire sur BallDontLie →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API BallDontLie</label>
          <input
            type="text"
            value={ballDontLieKey}
            onChange={(e) => setBallDontLieKey(e.target.value)}
            placeholder="Votre clé BallDontLie..."
            className="api-key-input"
            disabled={!ballDontLieEnabled}
          />
          <button 
            onClick={handleSaveBallDontLie} 
            disabled={loading || !ballDontLieEnabled}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>
          ✅ Source 3 : Euroleague (Gratuit)
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={euroleagueEnabled}
              onChange={(e) => {
                setEuroleagueEnabled(e.target.checked);
                handleToggleSource('EUROLEAGUE', e.target.checked);
              }}
            />
            <span className="slider"></span>
          </label>
        </h3>
        <p className="config-description">
          API officielle Euroleague, aucune clé requise. Fonctionne automatiquement.
        </p>
      </div>

      <div className="config-section">
        <h3>
          🤖 Source 4 : Gemini AI (Recommandé)
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
          Intelligence artificielle avec recherche Google temps réel. Trouve automatiquement les matchs et diffuseurs français.
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
          <li>Abonnez-vous à <a href="https://rapidapi.com/api-sports/api/api-basketball" target="_blank" rel="noopener noreferrer">API-Basketball</a></li>
          <li>Copiez votre clé API RapidAPI</li>
          <li>Collez la clé ci-dessus et cliquez sur "Sauvegarder la clé"</li>
          <li>Cliquez sur "Mettre à jour les matchs" pour tester</li>
          <li>Les matchs seront automatiquement mis à jour tous les jours à 6h00</li>
        </ol>
        
        <div className="info-box">
          <h4>📺 Diffuseurs français configurés :</h4>
          <ul>
            <li><strong>NBA :</strong> beIN Sports (400+ matchs), Prime Video (29 matchs dominicaux), NBA League Pass</li>
            <li><strong>WNBA :</strong> NBA League Pass, beIN Sports</li>
            <li><strong>Euroleague :</strong> SKWEEK (tous), La Chaîne L'Équipe (sélection), TV Monaco (AS Monaco)</li>
            <li><strong>Betclic Elite :</strong> beIN Sports, La Chaîne L'Équipe, DAZN</li>
            <li><strong>EuroCup :</strong> SKWEEK, EuroLeague TV</li>
            <li><strong>BCL :</strong> Courtside 1891</li>
          </ul>
        </div>

        <div className="warning-box">
          ⚠️ <strong>Plan gratuit :</strong> 100 requêtes/jour. Plans payants disponibles dès 10€/mois.
        </div>
      </div>
    </div>
  );
}

export default ApiBasketballConfig;
