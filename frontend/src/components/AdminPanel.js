import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/config';
import { useAuth } from '../context/AuthContext';
import ApiBasketballConfig from './ApiBasketballConfig';
import GeminiConfig from './GeminiConfig';
import LogoManager from './LogoManager';
import './AdminPanel.css';

function AdminPanel() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('config');
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  // Vérifier que le token existe avant de permettre l'accès
  useEffect(() => {
    if (!token) {
      setMessage('❌ Session expirée, veuillez vous reconnecter');
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setMessage('❌ Token manquant, veuillez vous reconnecter');
      return;
    }
    
    try {
      const response = await api.get('/admin/users');
      console.log('Users fetched:', response.data);
      setUsers(response.data);
      setMessage(''); // Efface le message d'erreur si succès
      if (response.data.length === 0) {
        setMessage('⚠️ Aucun utilisateur trouvé dans la base de données');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('❌ Session expirée, rechargez la page et reconnectez-vous');
        localStorage.removeItem('token');
      } else {
        setMessage(`❌ Erreur: ${error.response?.data?.error || error.message}`);
      }
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
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
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
      setMessage('✅ Utilisateur supprimé');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || '❌ Erreur lors de la suppression');
    }
  };

  const handleChangePassword = async (userId, username) => {
    const newPassword = window.prompt(`Nouveau mot de passe pour ${username}:`);
    if (!newPassword) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/password`, { password: newPassword });
      setMessage('✅ Mot de passe modifié avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || '❌ Erreur lors de la modification du mot de passe');
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
          className={activeTab === 'logos' ? 'active' : ''} 
          onClick={() => setActiveTab('logos')}
        >
          Logos
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="api-configs">
          <GeminiConfig />
          <div className="api-divider"></div>
          <ApiBasketballConfig />
        </div>
      )}

      {activeTab === 'logos' && (
        <div className="admin-content">
          <LogoManager />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <h3>Gestion des utilisateurs</h3>
          {users.length === 0 && !message && (
            <p style={{textAlign: 'center', padding: '2rem', color: '#999'}}>
              Chargement des utilisateurs...
            </p>
          )}
          {users.length > 0 && (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Identifiant</th>
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
                      <td><strong>{u.username}</strong></td>
                      <td>{u.name}</td>
                      <td>{u.email || '-'}</td>
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
                        <button 
                          onClick={() => handleChangePassword(u.id, u.username)}
                          className="btn-edit"
                          style={{marginRight: '5px'}}
                        >
                          Changer mot de passe
                        </button>
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
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
