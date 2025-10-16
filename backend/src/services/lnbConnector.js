const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LNB_CALENDAR_API = 'https://www.lnb.fr/wp-json/lnb/v2/calendar';

async function fetchBetclicEliteSchedule() {
  console.log('  🏀 Fetching Betclic Elite schedule from LNB official API...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];
    
    const response = await axios.get(LNB_CALENDAR_API, {
      params: {
        competition: 'jeepelite',
        from: fromDate,
        to: toDate
      },
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const games = response.data;
    
    if (!Array.isArray(games)) {
      throw new Error('Invalid LNB schedule response');
    }
    
    console.log(`  📅 Found ${games.length} Betclic Elite games in next 21 days`);
    
    let matchCount = 0;
    for (const game of games) {
      await saveLNBMatch(game);
      matchCount++;
    }
    
    console.log(`  ✅ Betclic Elite: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ LNB API error:', error.message);
    return 0;
  }
}

async function saveLNBMatch(game) {
  const externalId = `betclic-${game.id}`;
  
  const homeTeamName = game.home?.name || game.homeTeam || 'Unknown';
  const awayTeamName = game.away?.name || game.awayTeam || 'Unknown';
  const gameDateTime = new Date(game.date || game.datetime);
  
  const league = await prisma.league.upsert({
    where: { name: 'Betclic Elite' },
    update: {},
    create: {
      name: 'Betclic Elite',
      shortName: 'BE',
      country: 'France',
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
  
  const status = game.status === 'finished' ? 'finished' : 
                 game.status === 'live' ? 'live' : 'scheduled';
  
  if (existingMatch) {
    await prisma.match.update({
      where: { id: existingMatch.id },
      data: {
        dateTime: gameDateTime,
        status,
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
        status,
        homeScore: game.home?.score || null,
        awayScore: game.away?.score || null
      }
    });
  }
}

module.exports = {
  fetchBetclicEliteSchedule
};
