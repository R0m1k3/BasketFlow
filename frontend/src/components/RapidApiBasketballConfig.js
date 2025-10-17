import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApiBasketballConfig.css';

function RapidApiBasketballConfig() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetchCurrentKey();
  }, []);

  const fetchCurrentKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/config/RAPIDAPI_BASKETBALL_KEY', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.value) {
        setApiKey(response.data.value);
      }
    } catch (error) {
      console.error('Error fetching RapidAPI key:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    setTestResults(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/config', 
        {
          key: 'RAPIDAPI_BASKETBALL_KEY',
          value: apiKey
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage('✅ RapidAPI Basketball key saved successfully!');
    } catch (error) {
      setMessage('❌ Error saving key: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage('');
    setTestResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/test-rapidapi-basketball',
        { apiKey },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTestResults(response.data);
      setMessage('✅ API test completed!');
    } catch (error) {
      setMessage('❌ Test failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setLoading(true);
    setMessage('Updating matches from RapidAPI Basketball...');
    setTestResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/update-matches',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage(`✅ Updated ${response.data.count} matches from RapidAPI Basketball!`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage('❌ Update failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-config-section">
      <h3>🏀 API-BASKETBALL (RapidAPI)</h3>
      <p className="api-description">
        <strong>All Leagues:</strong> NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL
      </p>
      
      <div className="api-setup-steps">
        <h4>Setup Instructions:</h4>
        <ol>
          <li>Go to <a href="https://rapidapi.com/api-sports/api/api-basketball" target="_blank" rel="noopener noreferrer">API-BASKETBALL on RapidAPI</a></li>
          <li>Subscribe to a plan (Free plan available)</li>
          <li>Copy your API key from the dashboard</li>
          <li>Paste it below and click Save</li>
          <li>Test the connection</li>
        </ol>
      </div>

      <div className="api-input-group">
        <label>RapidAPI Basketball Key:</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your RapidAPI Basketball key"
          disabled={loading}
        />
      </div>

      <div className="api-actions">
        <button onClick={handleSave} disabled={loading || !apiKey}>
          {loading ? 'Saving...' : 'Save Key'}
        </button>
        <button onClick={handleTest} disabled={loading || !apiKey} className="btn-secondary">
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={handleManualUpdate} disabled={loading || !apiKey} className="btn-update">
          {loading ? 'Updating...' : 'Manual Update'}
        </button>
      </div>

      {message && (
        <div className={`api-message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {testResults && (
        <div className="test-results">
          <h4>Test Results:</h4>
          {testResults.leagues && testResults.leagues.map((league, idx) => (
            <div key={idx} className="league-result">
              <strong>{league.name}:</strong> {league.matches} matches
            </div>
          ))}
          <p className="total-matches">Total: {testResults.totalMatches} matches</p>
        </div>
      )}
    </div>
  );
}

export default RapidApiBasketballConfig;
