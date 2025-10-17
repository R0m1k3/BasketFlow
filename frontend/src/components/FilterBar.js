import React from 'react';
import './FilterBar.css';

function FilterBar({ leagues, broadcasters, selectedLeague, selectedBroadcaster, onLeagueChange, onBroadcasterChange }) {
  // Ensure leagues and broadcasters are arrays
  const leaguesList = Array.isArray(leagues) ? leagues : [];
  const broadcastersList = Array.isArray(broadcasters) ? broadcasters : [];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Ligue:</label>
        <select value={selectedLeague} onChange={(e) => onLeagueChange(e.target.value)}>
          <option value="all">Toutes les ligues</option>
          {leaguesList.map(league => (
            <option key={league.id} value={league.id}>{league.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Chaîne:</label>
        <select value={selectedBroadcaster} onChange={(e) => onBroadcasterChange(e.target.value)}>
          <option value="all">Toutes les chaînes</option>
          {broadcastersList.map(broadcaster => (
            <option key={broadcaster.id} value={broadcaster.id}>
              {broadcaster.name} {broadcaster.isFree ? '📺' : '💰'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
