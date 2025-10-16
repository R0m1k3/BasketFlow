const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NBA_SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';

async function fetchNBASchedule() {
  console.log('  🏀 Fetching NBA schedule from official API...');
  
  try {
    const response = await axios.get(NBA_SCHEDULE_URL, {
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const schedule = response.data;
    
    if (!schedule?.leagueSchedule?.gameDates) {
      throw new Error('Invalid NBA schedule response');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    endDate.setHours(23, 59, 59, 999);
    
    const upcomingGames = [];
    
    // Filter games in date range first
    for (const gameDate of schedule.leagueSchedule.gameDates) {
      for (const game of gameDate.games) {
        const gameDateTime = new Date(game.gameDateTimeEst || game.gameDateEst);
        
        if (gameDateTime >= today && gameDateTime <= endDate) {
          upcomingGames.push(game);
        }
      }
    }
    
    console.log(`  📅 Found ${upcomingGames.length} NBA games in next 21 days`);
    
    // Save games
    let matchCount = 0;
    for (const game of upcomingGames) {
      await saveNBAMatch(game);
      matchCount++;
    }
    
    console.log(`  ✅ NBA: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ NBA API error:', error.message);
    return 0;
  }
}

async function saveNBAMatch(game) {
  const externalId = `nba-${game.gameId}`;
  
  const homeTeamName = game.homeTeam?.teamName || 'Unknown';
  const awayTeamName = game.awayTeam?.teamName || 'Unknown';
  const gameDateTime = new Date(game.gameDateTimeEst || game.gameDateEst);
  
  const nbaLeague = await prisma.league.upsert({
    where: { name: 'NBA' },
    update: {},
    create: {
      name: 'NBA',
      shortName: 'NBA',
      country: 'USA',
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
        status: game.gameStatus === 1 ? 'scheduled' : game.gameStatus === 2 ? 'live' : 'finished',
        homeScore: game.homeTeam?.score || null,
        awayScore: game.awayTeam?.score || null
      }
    });
  } else {
    await prisma.match.create({
      data: {
        externalId,
        dateTime: gameDateTime,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: nbaLeague.id,
        status: game.gameStatus === 1 ? 'scheduled' : 'live',
        homeScore: game.homeTeam?.score || null,
        awayScore: game.awayTeam?.score || null
      }
    });
  }
}

module.exports = {
  fetchNBASchedule
};
