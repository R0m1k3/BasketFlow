import React, { useState, useEffect } from 'react';
import WeeklyMatches from '../components/WeeklyMatches';
import MonthlyCalendar from '../components/MonthlyCalendar';
import FilterBar from '../components/FilterBar';
import axios from 'axios';
import './Home.css';

function Home() {
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
    <div className="home-page">
      <div className="home-header">
        <h2>Matchs diffusés en France</h2>
        <p>Découvrez tous les matchs de basket de la semaine</p>
      </div>

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
    </div>
  );
}

export default Home;
