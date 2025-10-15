import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('config');
  const [users, setUsers] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/config');
      const apiConfig = response.data.find(c => c.key === 'API_BASKETBALL_KEY');
      setApiKey(apiConfig?.value || '');
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'config') {
      fetchConfig();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchConfig, fetchUsers]);

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

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
      setMessage('✅ Rôle modifié avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la modification du rôle');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      setMessage('✅ Utilisateur supprimé');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || '❌ Erreur lors de la suppression');
    }
  };

  return (
    <div className="admin-panel">
      <h2>⚙️ Panneau d'administration</h2>
      
      {message && <div className="admin-message">{message}</div>}

      <div className="admin-tabs">
        <button 
          className={activeTab === 'config' ? 'active' : ''} 
          onClick={() => setActiveTab('config')}
        >
          Configuration API
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="admin-content">
          <div className="config-section">
            <h3>Clé API Basketball (RapidAPI)</h3>
            <p className="config-description">
              Configurez votre clé API pour récupérer les matchs en direct depuis API-Basketball.
              <br />
              <a href="https://rapidapi.com/api-sports/api/api-basketball" target="_blank" rel="noopener noreferrer">
                Obtenir une clé API →
              </a>
            </p>
            <div className="form-group">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Votre clé RapidAPI"
                className="api-key-input"
              />
              <button 
                onClick={handleSaveApiKey} 
                disabled={loading}
                className="btn-save"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <h3>Gestion des utilisateurs</h3>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {u.id !== user.id && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn-delete"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
