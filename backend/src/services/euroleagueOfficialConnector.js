const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EUROLEAGUE_API_BASE = 'https://live.euroleague.net/api';

async function fetchEuroleagueSchedule() {
  console.log('  🏀 Fetching Euroleague schedule from official API...');
  
  try {
    const currentSeason = 'E2024'; // 2024-25 season
    const response = await axios.get(`${EUROLEAGUE_API_BASE}/Calendar`, {
      params: {
        league: 'EL',
        seasoncode: currentSeason
      },
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const games = response.data;
    
    if (!Array.isArray(games)) {
      throw new Error('Invalid Euroleague schedule response');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    endDate.setHours(23, 59, 59, 999);
    
    const upcomingGames = games.filter(game => {
      const gameDate = new Date(game.Date || game.date);
      return gameDate >= today && gameDate <= endDate;
    });
    
    console.log(`  📅 Found ${upcomingGames.length} Euroleague games in next 21 days`);
    
    let matchCount = 0;
    for (const game of upcomingGames) {
      await saveEuroleagueMatch(game, 'Euroleague');
      matchCount++;
    }
    
    console.log(`  ✅ Euroleague: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Euroleague API error:', error.message);
    return 0;
  }
}

async function fetchEurocupSchedule() {
  console.log('  🏀 Fetching Eurocup schedule from official API...');
  
  try {
    const currentSeason = 'U2024'; // 2024-25 season
    const response = await axios.get(`${EUROLEAGUE_API_BASE}/Calendar`, {
      params: {
        league: 'EC',
        seasoncode: currentSeason
      },
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const games = response.data;
    
    if (!Array.isArray(games)) {
      throw new Error('Invalid Eurocup schedule response');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    endDate.setHours(23, 59, 59, 999);
    
    const upcomingGames = games.filter(game => {
      const gameDate = new Date(game.Date || game.date);
      return gameDate >= today && gameDate <= endDate;
    });
    
    console.log(`  📅 Found ${upcomingGames.length} Eurocup games in next 21 days`);
    
    let matchCount = 0;
    for (const game of upcomingGames) {
      await saveEuroleagueMatch(game, 'EuroCup');
      matchCount++;
    }
    
    console.log(`  ✅ Eurocup: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Eurocup API error:', error.message);
    return 0;
  }
}

async function saveEuroleagueMatch(game, leagueName) {
  const externalId = `${leagueName.toLowerCase()}-${game.Gamecode || game.code}`;
  
  const homeTeamName = game.HomeTeam || game.home || 'Unknown';
  const awayTeamName = game.AwayTeam || game.away || 'Unknown';
  const gameDateTime = new Date(game.Date || game.date);
  
  const league = await prisma.league.upsert({
    where: { name: leagueName },
    update: {},
    create: {
      name: leagueName,
      shortName: leagueName === 'Euroleague' ? 'EL' : 'EC',
      country: 'Europe',
      logo: null
    }
  });
  
  let homeTeam = await prisma.team.findFirst({
    where: { name: homeTeamName }
  });
  
  if (!homeTeam) {
    homeTeam = await prisma.team.create({
      data: {
        name: homeTeamName,
        logo: null
      }
    });
  }
  
  let awayTeam = await prisma.team.findFirst({
    where: { name: awayTeamName }
  });
  
  if (!awayTeam) {
    awayTeam = await prisma.team.create({
      data: {
        name: awayTeamName,
        logo: null
      }
    });
  }
  
  const existingMatch = await prisma.match.findUnique({
    where: { externalId }
  });
  
  if (existingMatch) {
    await prisma.match.update({
      where: { id: existingMatch.id },
      data: {
        dateTime: gameDateTime,
        status: game.Played ? 'finished' : 'scheduled',
        homeScore: game.HomeScore || null,
        awayScore: game.AwayScore || null
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
        status: game.Played ? 'finished' : 'scheduled',
        homeScore: game.HomeScore || null,
        awayScore: game.AwayScore || null
      }
    });
  }
}

module.exports = {
  fetchEuroleagueSchedule,
  fetchEurocupSchedule
};
