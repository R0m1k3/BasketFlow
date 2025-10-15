import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [ballDontLieKey, setBallDontLieKey] = useState('');
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
      setRapidApiKey(rapidApiConfig?.value || '');
      setBallDontLieKey(ballDontLieConfig?.value || '');
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
          L'application utilise 3 sources pour maximiser la couverture des matchs sans doublons.
        </p>
      </div>

      <div className="config-section">
        <h3>📊 Source 1 : RapidAPI (Optionnel)</h3>
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
          />
          <button 
            onClick={handleSaveRapidApi} 
            disabled={loading}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>🆓 Source 2 : BallDontLie (Gratuit)</h3>
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
          />
          <button 
            onClick={handleSaveBallDontLie} 
            disabled={loading}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>✅ Source 3 : Euroleague (Gratuit)</h3>
        <p className="config-description">
          API officielle Euroleague, aucune clé requise. Fonctionne automatiquement.
        </p>
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
