import React from 'react';
import './CompactMatchCard.css';

function CompactMatchCard({ match, getProxiedImageUrl, handleImageError, failedImages }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
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
    return colors[leagueName] || '#1a73e8';
  };

  const showScore = match.status === 'finished' || match.status === 'live';

  return (
    <div className={`compact-match-card ${match.status || 'scheduled'}`}>
      <div 
        className="compact-league-badge" 
        style={{ backgroundColor: getLeagueColor(match.league.name) }}
      >
        {match.league.shortName}
      </div>

      <div className="compact-match-content">
        <div className="compact-team-row">
          <div className="compact-team">
            {match.homeTeam.logo && !failedImages.has(match.homeTeam.logo) ? (
              <img 
                src={getProxiedImageUrl(match.homeTeam.logo)} 
                alt={match.homeTeam.name} 
                className="compact-team-logo"
                onError={() => handleImageError(match.homeTeam.logo)}
              />
            ) : (
              <div className="compact-team-placeholder">
                {match.homeTeam.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="compact-team-name">{match.homeTeam.name}</span>
          </div>
          {showScore && <span className="compact-score">{match.homeScore}</span>}
        </div>

        <div className="compact-separator">
          {showScore ? (
            <>
              <span className="compact-vs">-</span>
              {match.status === 'live' && <span className="compact-live">LIVE</span>}
            </>
          ) : (
            <>
              <span className="compact-vs">vs</span>
              <span className="compact-time">{formatTime(match.dateTime)}</span>
            </>
          )}
        </div>

        <div className="compact-team-row">
          <div className="compact-team">
            {match.awayTeam.logo && !failedImages.has(match.awayTeam.logo) ? (
              <img 
                src={getProxiedImageUrl(match.awayTeam.logo)} 
                alt={match.awayTeam.name} 
                className="compact-team-logo"
                onError={() => handleImageError(match.awayTeam.logo)}
              />
            ) : (
              <div className="compact-team-placeholder">
                {match.awayTeam.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="compact-team-name">{match.awayTeam.name}</span>
          </div>
          {showScore && <span className="compact-score">{match.awayScore}</span>}
        </div>
      </div>

      {match.broadcasts && match.broadcasts.length > 0 && (
        <div className="compact-broadcasters">
          {match.broadcasts.map((broadcast, idx) => (
            broadcast.broadcaster.logo && !failedImages.has(broadcast.broadcaster.logo) ? (
              <img 
                key={idx}
                src={getProxiedImageUrl(broadcast.broadcaster.logo)} 
                alt={broadcast.broadcaster.name} 
                className="compact-broadcaster-logo"
                title={broadcast.broadcaster.name}
                onError={() => handleImageError(broadcast.broadcaster.logo)}
              />
            ) : (
              <span 
                key={idx} 
                className={`compact-broadcaster-text ${broadcast.broadcaster.isFree ? 'free' : 'paid'}`}
                title={broadcast.broadcaster.name}
              >
                {broadcast.broadcaster.name.substring(0, 6)}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default CompactMatchCard;
