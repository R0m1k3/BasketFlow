import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CompactMatchCard from './CompactMatchCard';
import './DateMatches.css';

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

  const groupByLeague = (matches) => {
    const grouped = {};
    matches.forEach(match => {
      const leagueName = match.league.name;
      if (!grouped[leagueName]) {
        grouped[leagueName] = {
          league: match.league,
          matches: []
        };
      }
      grouped[leagueName].matches.push(match);
    });
    return Object.values(grouped);
  };

  const leagueGroups = groupByLeague(matches);

  return (
    <div className="modern-container">
      <div className="modern-header">
        <h2>📆 Matchs par date</h2>
      </div>

      <div className="date-selector-card">
        <div className="date-selector-content">
          <label htmlFor="date-input" className="date-label">Choisir une date</label>
          <input 
            id="date-input"
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="modern-date-input"
          />
        </div>
        <div className="selected-date-display">
          {formatSelectedDate(selectedDate)}
        </div>
      </div>

      {loading ? (
        <div className="modern-loader">
          <div className="spinner"></div>
          <p>Chargement des matchs...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="modern-empty">
          <div className="empty-icon">📭</div>
          <p>Aucun match pour cette date</p>
        </div>
      ) : (
        <>
          <div className="matches-summary">
            {matches.length} match{matches.length > 1 ? 's' : ''} au programme
          </div>

          {leagueGroups.map(group => (
            <div key={group.league.id} className="league-section">
              <div className="league-section-header">
                <h3>{group.league.name}</h3>
                <span className="match-count">{group.matches.length} match{group.matches.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="matches-grid">
                {group.matches.map(match => (
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
        </>
      )}
    </div>
  );
}

export default DateMatches;
