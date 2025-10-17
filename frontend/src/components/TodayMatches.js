import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WeeklyMatches.css';

function TodayMatches({ selectedLeague, selectedBroadcaster }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState(new Set());

  const getProxiedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  };

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  const isToday = (dateString) => {
    const matchDate = new Date(dateString);
    const today = new Date();
    return matchDate.getDate() === today.getDate() &&
           matchDate.getMonth() === today.getMonth() &&
           matchDate.getFullYear() === today.getFullYear();
  };

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/matches/week');
      
      // Ensure response.data is an array
      const allMatches = Array.isArray(response.data) ? response.data : [];
      let filteredMatches = allMatches.filter(m => isToday(m.dateTime));

      if (selectedLeague !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.leagueId === selectedLeague);
      }

      if (selectedBroadcaster !== 'all') {
        filteredMatches = filteredMatches.filter(m => 
          m.broadcasts && Array.isArray(m.broadcasts) && 
          m.broadcasts.some(b => b.broadcasterId === selectedBroadcaster)
        );
      }

      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
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
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTodayDate = () => {
    const today = new Date();
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(today);
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
    return (
      <div className="weekly-matches">
        <h2>Matchs d'aujourd'hui</h2>
        <div className="today-date">{getTodayDate()}</div>
        <div className="no-matches">Aucun match aujourd'hui</div>
      </div>
    );
  }

  return (
    <div className="weekly-matches">
      <h2>Matchs d'aujourd'hui</h2>
      <div className="today-date">{getTodayDate()}</div>
      <div className="matches-list">
        {matches.map(match => (
          <div key={match.id} className={`match-card ${match.status || 'scheduled'}`}>
            <div 
              className="league-badge" 
              style={{ backgroundColor: getLeagueColor(match.league.name) }}
            >
              {match.league.shortName}
            </div>
            
            <div className="match-info">
              <div className="match-teams">
                <div className="team">
                  {match.homeTeam.logo && !failedImages.has(match.homeTeam.logo) ? (
                    <img 
                      src={getProxiedImageUrl(match.homeTeam.logo)} 
                      alt={match.homeTeam.name} 
                      className="team-logo"
                      onError={() => handleImageError(match.homeTeam.logo)}
                    />
                  ) : (
                    <div className="team-logo-placeholder">
                      {match.homeTeam.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span>{match.homeTeam.name}</span>
                </div>
                <div className={`score-separator ${match.status}`}>
                  {match.status === 'finished' || match.status === 'live' ? (
                    <div className="score">
                      <span className="home-score">{match.homeScore}</span>
                      <span className="separator">-</span>
                      <span className="away-score">{match.awayScore}</span>
                      {match.status === 'live' && <span className="live-indicator">LIVE</span>}
                    </div>
                  ) : (
                    <span className="match-time">{formatDate(match.dateTime)}</span>
                  )}
                </div>
                <div className="team">
                  {match.awayTeam.logo && !failedImages.has(match.awayTeam.logo) ? (
                    <img 
                      src={getProxiedImageUrl(match.awayTeam.logo)} 
                      alt={match.awayTeam.name} 
                      className="team-logo"
                      onError={() => handleImageError(match.awayTeam.logo)}
                    />
                  ) : (
                    <div className="team-logo-placeholder">
                      {match.awayTeam.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span>{match.awayTeam.name}</span>
                </div>
              </div>
              
              {match.venue && (
                <div className="match-details">
                  <div className="venue">📍 {match.venue}</div>
                </div>
              )}
            </div>

            <div className="broadcasters">
              <div className="broadcasters-label">Diffusion :</div>
              <div className="broadcaster-list">
                {match.broadcasts.map(broadcast => (
                  <span 
                    key={broadcast.id} 
                    className={`broadcaster-tag ${broadcast.broadcaster.isFree ? 'free' : 'paid'}`}
                  >
                    {broadcast.broadcaster.logo && !failedImages.has(broadcast.broadcaster.logo) ? (
                      <>
                        <img 
                          src={getProxiedImageUrl(broadcast.broadcaster.logo)} 
                          alt={broadcast.broadcaster.name} 
                          className="broadcaster-logo"
                          onError={() => handleImageError(broadcast.broadcaster.logo)}
                        />
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

export default TodayMatches;
