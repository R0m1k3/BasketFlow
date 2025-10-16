const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EUROLEAGUE_API_BASE = 'https://api-live.euroleague.net/v1';

async function fetchEuroleagueSchedule() {
  console.log('  🏀 Fetching Euroleague schedule from official API...');
  
  try {
    const response = await axios.get(`${EUROLEAGUE_API_BASE}/schedules`, {
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
      const gameDate = new Date(game.date);
      return gameDate >= today && gameDate <= endDate && game.played === false;
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
    const response = await axios.get(`${EUROLEAGUE_API_BASE}/schedules`, {
      params: {
        competitionCode: 'U'
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
      const gameDate = new Date(game.date);
      return gameDate >= today && gameDate <= endDate && game.played === false;
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
  const externalId = `${leagueName.toLowerCase()}-${game.gameId || game.code}`;
  
  const homeTeamName = game.home?.name || game.homeTeam || 'Unknown';
  const awayTeamName = game.away?.name || game.awayTeam || 'Unknown';
  const gameDateTime = new Date(game.date);
  
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
        status: game.played ? 'finished' : 'scheduled',
        homeScore: game.home?.score || null,
        awayScore: game.away?.score || null
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
        status: game.played ? 'finished' : 'scheduled',
        homeScore: game.home?.score || null,
        awayScore: game.away?.score || null
      }
    });
  }
}

module.exports = {
  fetchEuroleagueSchedule,
  fetchEurocupSchedule
};
