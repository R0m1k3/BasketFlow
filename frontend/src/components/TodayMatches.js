import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CompactMatchCard from './CompactMatchCard';
import './TodayMatches.css';

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

  const getTodayDate = () => {
    const today = new Date();
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(today);
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
          <h2>🏀 Matchs d'aujourd'hui</h2>
          <p className="modern-date">{getTodayDate()}</p>
        </div>
        <div className="modern-empty">
          <div className="empty-icon">📭</div>
          <p>Aucun match aujourd'hui</p>
        </div>
      </div>
    );
  }

  const leagueGroups = groupByLeague(matches);

  return (
    <div className="modern-container">
      <div className="modern-header">
        <h2>🏀 Matchs d'aujourd'hui</h2>
        <p className="modern-date">{getTodayDate()}</p>
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
    </div>
  );
}

export default TodayMatches;
