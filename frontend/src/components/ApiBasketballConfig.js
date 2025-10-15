import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/admin/config');
      const apiKeyConfig = response.data.find(c => c.key === 'API_BASKETBALL_KEY');
      setApiKey(apiKeyConfig?.value || '');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveApiKey = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/API_BASKETBALL_KEY', {
        value: apiKey,
        description: 'Clé API pour API-Basketball (RapidAPI)'
      });
      setMessage('✅ Clé API sauvegardée avec succès');
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
        <h3>🏀 Configuration API-Basketball</h3>
        <p className="config-description">
          API-Basketball fournit des données en temps réel pour NBA, WNBA, Euroleague, et Betclic Elite.
          <br />
          <a href="https://rapidapi.com/api-sports/api/api-basketball" target="_blank" rel="noopener noreferrer">
            S'inscrire sur RapidAPI →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API RapidAPI</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Votre clé RapidAPI..."
            className="api-key-input"
          />
          <button 
            onClick={handleSaveApiKey} 
            disabled={loading}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder la clé'}
          </button>
        </div>

        {apiKey && (
          <div className="form-group">
            <button 
              onClick={handleTestConnection} 
              disabled={loading}
              className="btn-test"
            >
              {loading ? '⏳ Test en cours...' : '🚀 Mettre à jour les matchs'}
            </button>
          </div>
        )}

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
