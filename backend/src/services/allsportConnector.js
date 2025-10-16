const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// AllSportAPI endpoints
const ALLSPORT_BASE_URL = 'https://allsportsapi.com/api/basketball';

async function fetchAllSportMatches(apiKey) {
  console.log('  🏀 Fetching basketball matches from AllSportAPI...');
  
  if (!apiKey) {
    console.log('  ⚠️  AllSportAPI key not configured');
    return 0;
  }
  
  try {
    const today = new Date();
    const fromDate = today.toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    const toDate = endDate.toISOString().split('T')[0];
    
    // Test endpoint - get fixtures
    const response = await axios.get(`${ALLSPORT_BASE_URL}/?met=Fixtures&APIkey=${apiKey}&from=${fromDate}&to=${toDate}`, {
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const data = response.data;
    
    if (!data || !data.result) {
      console.log('  ⚠️  No results from AllSportAPI');
      console.log('  Response:', JSON.stringify(data).substring(0, 200));
      return 0;
    }
    
    const fixtures = data.result;
    console.log(`  📅 Found ${fixtures.length} fixtures from AllSportAPI`);
    
    let matchCount = 0;
    for (const fixture of fixtures) {
      await saveAllSportMatch(fixture);
      matchCount++;
    }
    
    console.log(`  ✅ AllSportAPI: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    if (error.response) {
      console.error('  ❌ AllSportAPI error:', error.response.status, error.response.statusText);
      console.error('  Response:', JSON.stringify(error.response.data).substring(0, 200));
    } else {
      console.error('  ❌ AllSportAPI error:', error.message);
    }
    return 0;
  }
}

async function saveAllSportMatch(fixture) {
  try {
    const externalId = `allsport-${fixture.event_key || fixture.match_id}`;
    
    const leagueName = fixture.league_name || 'Unknown League';
    const homeTeamName = fixture.event_home_team || fixture.home_team || 'Unknown';
    const awayTeamName = fixture.event_away_team || fixture.away_team || 'Unknown';
    const gameDateTime = new Date(fixture.event_date + ' ' + (fixture.event_time || '20:00'));
    
    // Map league to our standard names
    const mappedLeague = mapLeagueName(leagueName);
    
    const league = await prisma.league.upsert({
      where: { name: mappedLeague },
      update: {},
      create: {
        name: mappedLeague,
        shortName: getLeagueShortName(mappedLeague),
        country: getLeagueCountry(mappedLeague),
        logo: null
      }
    });
    
    let homeTeam = await prisma.team.findFirst({
      where: { name: homeTeamName }
    });
    
    if (!homeTeam) {
      homeTeam = await prisma.team.create({
        data: { name: homeTeamName, logo: null }
      });
    }
    
    let awayTeam = await prisma.team.findFirst({
      where: { name: awayTeamName }
    });
    
    if (!awayTeam) {
      awayTeam = await prisma.team.create({
        data: { name: awayTeamName, logo: null }
      });
    }
    
    const existingMatch = await prisma.match.findUnique({
      where: { externalId }
    });
    
    const status = fixture.event_status === 'Finished' ? 'finished' : 
                   fixture.event_status === 'Live' ? 'live' : 'scheduled';
    
    if (existingMatch) {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          dateTime: gameDateTime,
          status,
          homeScore: parseInt(fixture.event_final_result?.split('-')[0]) || null,
          awayScore: parseInt(fixture.event_final_result?.split('-')[1]) || null
        }
      });
    } else {
      await prisma.match.create({
        data: {
          externalId,
          dateTime: gameDateTime,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
          status,
          homeScore: parseInt(fixture.event_final_result?.split('-')[0]) || null,
          awayScore: parseInt(fixture.event_final_result?.split('-')[1]) || null
        }
      });
    }
  } catch (error) {
    console.error(`    ⚠️  Error saving AllSport match:`, error.message);
  }
}

function mapLeagueName(apiLeagueName) {
  const name = apiLeagueName.toLowerCase();
  
  if (name.includes('nba')) return 'NBA';
  if (name.includes('wnba')) return 'WNBA';
  if (name.includes('euroleague') || name.includes('euro league')) return 'Euroleague';
  if (name.includes('eurocup') || name.includes('euro cup')) return 'EuroCup';
  if (name.includes('betclic') || name.includes('lnb') || name.includes('elite')) return 'Betclic Elite';
  if (name.includes('bcl') || name.includes('champions league')) return 'BCL';
  
  return apiLeagueName; // Return as-is if no match
}

function getLeagueShortName(leagueName) {
  const map = {
    'NBA': 'NBA',
    'WNBA': 'WNBA',
    'Euroleague': 'EL',
    'EuroCup': 'EC',
    'Betclic Elite': 'BE',
    'BCL': 'BCL'
  };
  return map[leagueName] || leagueName.substring(0, 3).toUpperCase();
}

function getLeagueCountry(leagueName) {
  const map = {
    'NBA': 'USA',
    'WNBA': 'USA',
    'Euroleague': 'Europe',
    'EuroCup': 'Europe',
    'Betclic Elite': 'France',
    'BCL': 'Europe'
  };
  return map[leagueName] || 'International';
}

module.exports = {
  fetchAllSportMatches
};
