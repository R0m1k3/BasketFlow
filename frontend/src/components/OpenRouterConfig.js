import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

function OpenRouterConfig() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/admin/config');
      const apiKeyConfig = response.data.find(c => c.key === 'OPENROUTER_API_KEY');
      const modelConfig = response.data.find(c => c.key === 'OPENROUTER_MODEL');
      
      setApiKey(apiKeyConfig?.value || '');
      setSelectedModel(modelConfig?.value || '');

      if (apiKeyConfig?.value) {
        fetchModels();
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await axios.get('/api/openrouter/models');
      
      const allModels = [
        ...response.data.freeModels.map(m => ({ ...m, category: 'Gratuit' })),
        ...response.data.paidModels.map(m => ({ ...m, category: 'Payant' }))
      ];
      
      setModels(allModels);
    } catch (error) {
      console.error('Error fetching models:', error);
      setMessage('❌ Erreur lors de la récupération des modèles');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveApiKey = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/OPENROUTER_API_KEY', {
        value: apiKey,
        description: 'Clé API pour OpenRouter'
      });
      setMessage('✅ Clé API sauvegardée avec succès');
      setTimeout(() => setMessage(''), 3000);
      
      if (apiKey) {
        fetchModels();
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModel = async () => {
    if (!selectedModel) {
      setMessage('❌ Veuillez sélectionner un modèle');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await axios.put('/api/admin/config/OPENROUTER_MODEL', {
        value: selectedModel,
        description: 'Modèle LLM pour OpenRouter'
      });
      setMessage('✅ Modèle sauvegardé avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde du modèle');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage('');
    setTestResult(null);
    
    try {
      const response = await axios.get('/api/openrouter/test');
      setTestResult(response.data);
      setMessage('✅ Test réussi !');
    } catch (error) {
      setTestResult(null);
      setMessage(error.response?.data?.error || '❌ Erreur lors du test');
    } finally {
      setLoading(false);
    }
  };

  const freeModels = models.filter(m => m.category === 'Gratuit');
  const paidModels = models.filter(m => m.category === 'Payant');

  return (
    <div className="admin-content">
      {message && <div className="admin-message">{message}</div>}

      <div className="config-section">
        <h3>🤖 Configuration OpenRouter</h3>
        <p className="config-description">
          Configurez OpenRouter pour utiliser l'IA dans le scraping automatique des matchs.
          <br />
          <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">
            Créer un compte OpenRouter →
          </a>
        </p>

        <div className="form-group">
          <label>Clé API OpenRouter</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
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
          <>
            <div className="form-group">
              <label>Modèle LLM</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="model-select"
                  disabled={loadingModels}
                >
                  <option value="">Sélectionner un modèle...</option>
                  
                  {freeModels.length > 0 && (
                    <optgroup label="🆓 Modèles Gratuits (Recommandé)">
                      {freeModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.context_length ? `(${model.context_length} tokens)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {paidModels.length > 0 && (
                    <optgroup label="💰 Modèles Payants">
                      {paidModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.context_length ? `(${model.context_length} tokens)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                
                <button 
                  onClick={fetchModels} 
                  disabled={loadingModels}
                  className="btn-refresh"
                  title="Rafraîchir la liste des modèles"
                >
                  {loadingModels ? '⏳' : '🔄'}
                </button>
              </div>
              
              {selectedModel && (
                <div className="model-info">
                  {models.find(m => m.id === selectedModel)?.description || ''}
                </div>
              )}
            </div>

            <div className="form-group">
              <button 
                onClick={handleSaveModel} 
                disabled={loading || !selectedModel}
                className="btn-save"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder le modèle'}
              </button>
              
              <button 
                onClick={handleTestConnection} 
                disabled={loading || !selectedModel}
                className="btn-test"
                style={{ marginLeft: '10px' }}
              >
                {loading ? 'Test...' : 'Tester la connexion'}
              </button>
            </div>

            {testResult && (
              <div className="test-result">
                <h4>✅ Résultat du test</h4>
                <p><strong>Modèle :</strong> {testResult.model}</p>
                <p><strong>Réponse :</strong> {testResult.response}</p>
                {testResult.usage && (
                  <p><strong>Tokens utilisés :</strong> {testResult.usage.total_tokens}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="config-section">
        <h3>📖 Guide d'utilisation</h3>
        <ol className="usage-guide">
          <li>Créez un compte sur <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">OpenRouter</a></li>
          <li>Générez une clé API dans les paramètres</li>
          <li>Collez la clé ci-dessus et cliquez sur "Sauvegarder la clé"</li>
          <li>Sélectionnez un modèle (recommandé : Gemini 2.5 Flash - gratuit)</li>
          <li>Testez la connexion</li>
          <li>Le système utilisera ce modèle pour scraper les sources automatiquement</li>
        </ol>
        
        <div className="warning-box">
          ⚠️ <strong>Modèles gratuits :</strong> Limités à 50 requêtes/jour sans crédit, 1000/jour avec 10$ de crédit ajouté.
        </div>
      </div>
    </div>
  );
}

export default OpenRouterConfig;
