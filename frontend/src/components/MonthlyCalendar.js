import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import './MonthlyCalendar.css';

function MonthlyCalendar({ selectedLeague, selectedBroadcaster }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchMonthMatches = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await axios.get(`/api/matches/month/${year}/${month}`);
      
      let matches = response.data;

      if (selectedLeague !== 'all') {
        matches = matches.filter(m => m.leagueId === selectedLeague);
      }

      if (selectedBroadcaster !== 'all') {
        matches = matches.filter(m => 
          m.broadcasts.some(b => b.broadcasterId === selectedBroadcaster)
        );
      }

      const calendarEvents = matches.map(match => ({
        id: match.id,
        title: `${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`,
        start: match.dateTime,
        backgroundColor: getLeagueColor(match.league.name),
        borderColor: getLeagueColor(match.league.name),
        extendedProps: {
          league: match.league.name,
          homeTeamLogo: match.homeTeam.logo,
          awayTeamLogo: match.awayTeam.logo,
          broadcasters: match.broadcasts.map(b => ({
            name: b.broadcaster.name,
            logo: b.broadcaster.logo
          }))
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching month matches:', error);
    }
  }, [currentDate, selectedLeague, selectedBroadcaster]);

  useEffect(() => {
    fetchMonthMatches();
  }, [fetchMonthMatches]);

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

  const handleDateSet = (arg) => {
    setCurrentDate(arg.view.currentStart);
  };

  const renderEventContent = (eventInfo) => {
    const { homeTeamLogo, awayTeamLogo, broadcasters } = eventInfo.event.extendedProps;
    
    return (
      <div className="event-content">
        <div className="event-teams-logos">
          {homeTeamLogo && <img src={homeTeamLogo} alt="Home" className="event-team-logo" />}
          {awayTeamLogo && <img src={awayTeamLogo} alt="Away" className="event-team-logo" />}
        </div>
        <div className="event-title">{eventInfo.event.title}</div>
        <div className="event-broadcasters">
          {broadcasters && broadcasters.slice(0, 2).map((b, idx) => (
            b.logo ? (
              <img key={idx} src={b.logo} alt={b.name} className="event-broadcaster-logo" title={b.name} />
            ) : (
              <span key={idx} className="event-broadcaster-text" title={b.name}>
                {b.name.substring(0, 3)}
              </span>
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="monthly-calendar">
      <h2>Calendrier mensuel</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        events={events}
        datesSet={handleDateSet}
        eventContent={renderEventContent}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        height="auto"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false
        }}
        buttonText={{
          today: "Aujourd'hui"
        }}
      />
      <div className="calendar-legend">
        <h3>Légende :</h3>
        <div className="legend-items">
          <div className="legend-item"><span style={{backgroundColor: '#1D428A'}}></span> NBA</div>
          <div className="legend-item"><span style={{backgroundColor: '#C8102E'}}></span> WNBA</div>
          <div className="legend-item"><span style={{backgroundColor: '#FF7900'}}></span> Euroleague</div>
          <div className="legend-item"><span style={{backgroundColor: '#009CDE'}}></span> EuroCup</div>
          <div className="legend-item"><span style={{backgroundColor: '#000000'}}></span> BCL</div>
          <div className="legend-item"><span style={{backgroundColor: '#002654'}}></span> Betclic Elite</div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
