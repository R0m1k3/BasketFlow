import React, { useState, useEffect } from 'react';
import api from '../api/config';
import './LogoManager.css';

function LogoManager() {
  const [teams, setTeams] = useState([]);
  const [broadcasters, setBroadcasters] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingBroadcaster, setEditingBroadcaster] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('teams');

  useEffect(() => {
    fetchTeams();
    fetchBroadcasters();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/admin/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchBroadcasters = async () => {
    try {
      const response = await api.get('/admin/broadcasters-list');
      setBroadcasters(response.data);
    } catch (error) {
      console.error('Error fetching broadcasters:', error);
    }
  };

  const handleUpdateTeamLogo = async (teamId) => {
    try {
      await api.put(`/admin/teams/${teamId}/logo`, { logo: logoUrl });
      fetchTeams();
      setEditingTeam(null);
      setLogoUrl('');
      setMessage('✅ Logo d\'équipe mis à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la mise à jour');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdateBroadcasterLogo = async (broadcasterId) => {
    try {
      await api.put(`/admin/broadcasters/${broadcasterId}/logo`, { logo: logoUrl });
      fetchBroadcasters();
      setEditingBroadcaster(null);
      setLogoUrl('');
      setMessage('✅ Logo de diffuseur mis à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la mise à jour');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startEditingTeam = (team) => {
    setEditingTeam(team.id);
    setLogoUrl(team.logo || '');
  };

  const startEditingBroadcaster = (broadcaster) => {
    setEditingBroadcaster(broadcaster.id);
    setLogoUrl(broadcaster.logo || '');
  };

  return (
    <div className="logo-manager">
      <h3>Gestion des Logos</h3>
      
      {message && <div className="logo-message">{message}</div>}

      <div className="logo-tabs">
        <button 
          className={activeTab === 'teams' ? 'active' : ''} 
          onClick={() => setActiveTab('teams')}
        >
          Équipes ({teams.length})
        </button>
        <button 
          className={activeTab === 'broadcasters' ? 'active' : ''} 
          onClick={() => setActiveTab('broadcasters')}
        >
          Diffuseurs ({broadcasters.length})
        </button>
      </div>

      {activeTab === 'teams' && (
        <div className="logo-list">
          <table>
            <thead>
              <tr>
                <th>Équipe</th>
                <th>Logo actuel</th>
                <th>URL du logo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td>{team.name}</td>
                  <td>
                    {team.logo ? (
                      <img src={`/api/image-proxy?url=${encodeURIComponent(team.logo)}`} alt={team.name} className="logo-preview" />
                    ) : (
                      <div className="no-logo">Aucun logo</div>
                    )}
                  </td>
                  <td>
                    {editingTeam === team.id ? (
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.svg"
                        className="logo-input"
                      />
                    ) : (
                      <span className="logo-url">{team.logo || 'Non défini'}</span>
                    )}
                  </td>
                  <td>
                    {editingTeam === team.id ? (
                      <>
                        <button onClick={() => handleUpdateTeamLogo(team.id)} className="btn-save">
                          Enregistrer
                        </button>
                        <button onClick={() => { setEditingTeam(null); setLogoUrl(''); }} className="btn-cancel">
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEditingTeam(team)} className="btn-edit">
                        Modifier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'broadcasters' && (
        <div className="logo-list">
          <table>
            <thead>
              <tr>
                <th>Diffuseur</th>
                <th>Logo actuel</th>
                <th>URL du logo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {broadcasters.map(broadcaster => (
                <tr key={broadcaster.id}>
                  <td>{broadcaster.name}</td>
                  <td>
                    {broadcaster.logo ? (
                      <img src={`/api/image-proxy?url=${encodeURIComponent(broadcaster.logo)}`} alt={broadcaster.name} className="logo-preview" />
                    ) : (
                      <div className="no-logo">Aucun logo</div>
                    )}
                  </td>
                  <td>
                    {editingBroadcaster === broadcaster.id ? (
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.svg"
                        className="logo-input"
                      />
                    ) : (
                      <span className="logo-url">{broadcaster.logo || 'Non défini'}</span>
                    )}
                  </td>
                  <td>
                    {editingBroadcaster === broadcaster.id ? (
                      <>
                        <button onClick={() => handleUpdateBroadcasterLogo(broadcaster.id)} className="btn-save">
                          Enregistrer
                        </button>
                        <button onClick={() => { setEditingBroadcaster(null); setLogoUrl(''); }} className="btn-cancel">
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEditingBroadcaster(broadcaster)} className="btn-edit">
                        Modifier
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
  );
}

export default LogoManager;
