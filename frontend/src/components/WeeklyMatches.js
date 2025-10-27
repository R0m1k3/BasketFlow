import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CompactMatchCard from './CompactMatchCard';
import './WeeklyMatches.css';

function WeeklyMatches({ selectedLeague, selectedBroadcaster }) {
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

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/matches/week');
      
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
  }, [selectedLeague, selectedBroadcaster]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  };

  const groupByDateAndLeague = (matches) => {
    const dateGroups = {};
    
    matches.forEach(match => {
      const matchDate = new Date(match.dateTime);
      const dateKey = matchDate.toISOString().split('T')[0];
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          dateKey,
          dateDisplay: formatDateHeader(match.dateTime),
          leagues: {}
        };
      }
      
      const leagueName = match.league.name;
      if (!dateGroups[dateKey].leagues[leagueName]) {
        dateGroups[dateKey].leagues[leagueName] = {
          league: match.league,
          matches: []
        };
      }
      
      dateGroups[dateKey].leagues[leagueName].matches.push(match);
    });
    
    return Object.values(dateGroups).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  };

  if (loading) {
    return (
      <div className="modern-container">
        <div className="modern-loader">
          <div className="spinner"></div>
          <p>Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="modern-container">
        <div className="modern-header">
          <h2>📅 Matchs de la semaine</h2>
        </div>
        <div className="modern-empty">
          <div className="empty-icon">📭</div>
          <p>Aucun match trouvé pour cette sélection</p>
        </div>
      </div>
    );
  }

  const dateGroups = groupByDateAndLeague(matches);

  return (
    <div className="modern-container">
      <div className="modern-header">
        <h2>📅 Matchs de la semaine</h2>
        <p className="modern-date">{matches.length} match{matches.length > 1 ? 's' : ''} au programme</p>
      </div>

      {dateGroups.map(dateGroup => (
        <div key={dateGroup.dateKey} className="date-group">
          <div className="date-group-header">
            <h3>{dateGroup.dateDisplay}</h3>
          </div>

          {Object.values(dateGroup.leagues).map(leagueGroup => (
            <div key={leagueGroup.league.id} className="league-section">
              <div className="league-section-header">
                <h4>{leagueGroup.league.name}</h4>
                <span className="match-count">{leagueGroup.matches.length} match{leagueGroup.matches.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="matches-grid">
                {leagueGroup.matches.map(match => (
                  <CompactMatchCard
                    key={match.id}
                    match={match}
                    getProxiedImageUrl={getProxiedImageUrl}
                    handleImageError={handleImageError}
                    failedImages={failedImages}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default WeeklyMatches;
