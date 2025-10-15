import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WeeklyMatches.css';

function WeeklyMatches({ selectedLeague, selectedBroadcaster }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/matches/week');
      let filteredMatches = response.data;

      if (selectedLeague !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.leagueId === selectedLeague);
      }

      if (selectedBroadcaster !== 'all') {
        filteredMatches = filteredMatches.filter(m => 
          m.broadcasts.some(b => b.broadcasterId === selectedBroadcaster)
        );
      }

      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, selectedBroadcaster]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getLeagueColor = (leagueName) => {
    const colors = {
      'NBA': '#1D428A',
      'WNBA': '#C8102E',
      'Euroleague': '#FF7900',
      'EuroCup': '#009CDE',
      'BCL': '#000000',
      'Betclic Elite': '#002654'
    };
    return colors[leagueName] || '#333';
  };

  if (loading) {
    return <div className="loading">Chargement des matchs...</div>;
  }

  if (matches.length === 0) {
    return <div className="no-matches">Aucun match trouvé pour cette sélection</div>;
  }

  return (
    <div className="weekly-matches">
      <h2>Matchs de la semaine</h2>
      <div className="matches-list">
        {matches.map(match => (
          <div key={match.id} className="match-card">
            <div 
              className="league-badge" 
              style={{ backgroundColor: getLeagueColor(match.league.name) }}
            >
              {match.league.shortName}
            </div>
            
            <div className="match-info">
              <div className="match-teams">
                <div className="team">
                  {match.homeTeam.logo && (
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="team-logo" />
                  )}
                  <span>{match.homeTeam.name}</span>
                </div>
                <div className="vs">vs</div>
                <div className="team">
                  {match.awayTeam.logo && (
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="team-logo" />
                  )}
                  <span>{match.awayTeam.name}</span>
                </div>
              </div>
              
              <div className="match-details">
                <div className="date">{formatDate(match.dateTime)}</div>
                {match.venue && <div className="venue">📍 {match.venue}</div>}
              </div>
            </div>

            <div className="broadcasters">
              <div className="broadcasters-label">Diffusion :</div>
              <div className="broadcaster-list">
                {match.broadcasts.map(broadcast => (
                  <span 
                    key={broadcast.id} 
                    className={`broadcaster-tag ${broadcast.broadcaster.isFree ? 'free' : 'paid'}`}
                  >
                    {broadcast.broadcaster.logo ? (
                      <>
                        <img src={broadcast.broadcaster.logo} alt={broadcast.broadcaster.name} className="broadcaster-logo" />
                        <span className="broadcaster-name">{broadcast.broadcaster.name}</span>
                      </>
                    ) : (
                      <>
                        {broadcast.broadcaster.name}
                        {broadcast.broadcaster.isFree ? ' 📺' : ' 💰'}
                      </>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyMatches;
