const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { getTeamLogo } = require('../utils/logoMapping');
const prisma = new PrismaClient();

const NBA_SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const WNBA_SCHEDULE_URL = 'https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2.json';

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
    
    for (const gameDate of schedule.leagueSchedule.gameDates) {
      for (const game of gameDate.games) {
        const gameDateTime = new Date(game.gameDateTimeEst || game.gameDateEst);
        
        if (gameDateTime >= today && gameDateTime <= endDate) {
          upcomingGames.push(game);
        }
      }
    }
    
    console.log(`  📅 Found ${upcomingGames.length} NBA games in next 21 days`);
    
    let matchCount = 0;
    for (const game of upcomingGames) {
      await saveNBAMatch(game, 'NBA');
      matchCount++;
    }
    
    console.log(`  ✅ NBA: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ NBA API error:', error.message);
    return 0;
  }
}

async function fetchWNBASchedule() {
  console.log('  🏀 Fetching WNBA schedule from official API...');
  
  try {
    const response = await axios.get(WNBA_SCHEDULE_URL, {
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const schedule = response.data;
    
    if (!schedule?.leagueSchedule?.gameDates) {
      throw new Error('Invalid WNBA schedule response');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    endDate.setHours(23, 59, 59, 999);
    
    const upcomingGames = [];
    
    for (const gameDate of schedule.leagueSchedule.gameDates) {
      for (const game of gameDate.games) {
        const gameDateTime = new Date(game.gameDateTimeEst || game.gameDateEst);
        
        if (gameDateTime >= today && gameDateTime <= endDate) {
          upcomingGames.push(game);
        }
      }
    }
    
    console.log(`  📅 Found ${upcomingGames.length} WNBA games in next 21 days`);
    
    let matchCount = 0;
    for (const game of upcomingGames) {
      await saveNBAMatch(game, 'WNBA');
      matchCount++;
    }
    
    console.log(`  ✅ WNBA: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ WNBA API error:', error.message);
    return 0;
  }
}

async function saveNBAMatch(game, leagueName = 'NBA') {
  const prefix = leagueName.toLowerCase();
  const externalId = `${prefix}-${game.gameId}`;
  
  const homeTeamName = game.homeTeam?.teamName || 'Unknown';
  const awayTeamName = game.awayTeam?.teamName || 'Unknown';
  const gameDateTime = new Date(game.gameDateTimeEst || game.gameDateEst);
  
  const league = await prisma.league.upsert({
    where: { name: leagueName },
    update: {},
    create: {
      name: leagueName,
      shortName: leagueName,
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
        logo: getTeamLogo(homeTeamName)
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
        logo: getTeamLogo(awayTeamName)
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
        leagueId: league.id,
        status: game.gameStatus === 1 ? 'scheduled' : 'live',
        homeScore: game.homeTeam?.score || null,
        awayScore: game.awayTeam?.score || null
      }
    });
  }
}

module.exports = {
  fetchNBASchedule,
  fetchWNBASchedule
};
