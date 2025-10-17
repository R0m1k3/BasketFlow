import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WeeklyMatches.css';

function DateMatches({ selectedLeague, selectedBroadcaster }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState(new Set());
  
  const getParisDateString = () => {
    const parisDate = new Date().toLocaleString('en-CA', { 
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0];
    return parisDate;
  };
  
  const [selectedDate, setSelectedDate] = useState(getParisDateString());

  const getProxiedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  };

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/matches/by-date?date=${selectedDate}`);
      
      // Ensure response.data is an array
      let filteredMatches = Array.isArray(response.data) ? response.data : [];

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
  }, [selectedDate, selectedLeague, selectedBroadcaster]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatSelectedDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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

  return (
    <div className="weekly-matches">
      <h2>Matchs par date</h2>
      <div className="date-picker-container">
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
        <div className="selected-date-display">{formatSelectedDate(selectedDate)}</div>
      </div>

      {loading ? (
        <div className="loading">Chargement des matchs...</div>
      ) : matches.length === 0 ? (
        <div className="no-matches">Aucun match pour cette date</div>
      ) : (
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
                      <span>vs</span>
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
                
                <div className="match-datetime">
                  <span className="match-time">🕐 {formatTime(match.dateTime)}</span>
                </div>
                
                {match.broadcasts && match.broadcasts.length > 0 && (
                  <div className="broadcasters">
                    {match.broadcasts.map((broadcast, idx) => (
                      <div key={idx} className="broadcaster">
                        {broadcast.broadcaster.logo && !failedImages.has(broadcast.broadcaster.logo) ? (
                          <img 
                            src={getProxiedImageUrl(broadcast.broadcaster.logo)} 
                            alt={broadcast.broadcaster.name}
                            className="broadcaster-logo"
                            onError={() => handleImageError(broadcast.broadcaster.logo)}
                          />
                        ) : (
                          <span className="broadcaster-text">
                            📺 {broadcast.broadcaster.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DateMatches;
