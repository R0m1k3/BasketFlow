import React, { useState } from 'react';
import api from '../api/config';
import './AdminPanel.css';

function ApiBasketballConfig() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  const handleUpdateMatches = async () => {
    setLoading(true);
    setMessage('');
    setTestResult(null);
    
    try {
      const response = await api.post('/admin/update-matches');
      setTestResult(response.data);
      setMessage('✅ Mise à jour réussie !');
    } catch (error) {
      setTestResult(null);
      setMessage(error.response?.data?.error || '❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content">
      {message && <div className="admin-message">{message}</div>}

      <div className="config-section">
        <h3>🆓 Sources de données (100% gratuites)</h3>
        <p className="config-description">
          Le système utilise uniquement des APIs officielles gratuites pour récupérer les matchs de basketball.
        </p>
      </div>

      <div className="config-section">
        <h3>📊 Couverture actuelle</h3>
        <div className="info-box">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>✅ <strong>NBA</strong> - Official NBA API (cdn.nba.com) - ~134 matchs</li>
            <li>✅ <strong>WNBA</strong> - Official WNBA API (cdn.wnba.com) - Saison Mai-Sept</li>
            <li>✅ <strong>Euroleague</strong> - XML API (api-live.euroleague.net) - ~380 matchs</li>
            <li>✅ <strong>EuroCup</strong> - XML API (api-live.euroleague.net) - ~380 matchs</li>
            <li>✅ <strong>Betclic Elite</strong> - TheSportsDB API (thesportsdb.com) - ~15 matchs</li>
          </ul>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            <strong>Total : ~909 matchs</strong> sur 5 ligues professionnelles
          </p>
        </div>
      </div>

      <div className="config-section">
        <h3>🚀 Mise à jour manuelle</h3>
        <p className="config-description">
          Les matchs sont automatiquement mis à jour tous les jours à 6h00. 
          Vous pouvez aussi lancer une mise à jour manuelle :
        </p>
        <div className="form-group">
          <button 
            onClick={handleUpdateMatches} 
            disabled={loading}
            className="btn-test"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? '⏳ Mise à jour en cours...' : '🔄 Mettre à jour les matchs maintenant'}
          </button>
        </div>

        {testResult && testResult.success && (
          <div className="test-result">
            <h4>✅ Mise à jour réussie</h4>
            <p><strong>Matchs en base de données :</strong> {testResult.count || 0}</p>
            <p>Les matchs devraient apparaître dans la vue principale.</p>
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>ℹ️ Informations</h3>
        <div className="info-box">
          <ul>
            <li><strong>Aucune clé API requise</strong> - Toutes les sources sont publiques et gratuites</li>
            <li><strong>Mises à jour automatiques</strong> - Cron quotidien à 6h00 du matin</li>
            <li><strong>Diffuseurs français</strong> - beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN</li>
            <li><strong>Données authentiques</strong> - Directement depuis les APIs officielles des ligues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ApiBasketballConfig;
