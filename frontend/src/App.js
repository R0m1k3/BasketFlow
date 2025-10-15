import React, { useState, useEffect } from 'react';
import './App.css';
import WeeklyMatches from './components/WeeklyMatches';
import MonthlyCalendar from './components/MonthlyCalendar';
import FilterBar from './components/FilterBar';
import axios from 'axios';

function App() {
  const [view, setView] = useState('week');
  const [leagues, setLeagues] = useState([]);
  const [broadcasters, setBroadcasters] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedBroadcaster, setSelectedBroadcaster] = useState('all');

  useEffect(() => {
    fetchLeagues();
    fetchBroadcasters();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get('/api/leagues');
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchBroadcasters = async () => {
    try {
      const response = await axios.get('/api/broadcasters');
      setBroadcasters(response.data);
    } catch (error) {
      console.error('Error fetching broadcasters:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏀 Matchs de Basket - France</h1>
        <p>Tous les matchs diffusés en France cette semaine</p>
      </header>

      <nav className="view-toggle">
        <button 
          className={view === 'week' ? 'active' : ''} 
          onClick={() => setView('week')}
        >
          Cette semaine
        </button>
        <button 
          className={view === 'month' ? 'active' : ''} 
          onClick={() => setView('month')}
        >
          Calendrier mensuel
        </button>
      </nav>

      <FilterBar
        leagues={leagues}
        broadcasters={broadcasters}
        selectedLeague={selectedLeague}
        selectedBroadcaster={selectedBroadcaster}
        onLeagueChange={setSelectedLeague}
        onBroadcasterChange={setSelectedBroadcaster}
      />

      <main className="content">
        {view === 'week' ? (
          <WeeklyMatches 
            selectedLeague={selectedLeague}
            selectedBroadcaster={selectedBroadcaster}
          />
        ) : (
          <MonthlyCalendar 
            selectedLeague={selectedLeague}
            selectedBroadcaster={selectedBroadcaster}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>Mise à jour quotidienne à 6h00 | Données fournies par API-Basketball</p>
      </footer>
    </div>
  );
}

export default App;
