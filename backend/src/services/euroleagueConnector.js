const axios = require('axios');
const xml2js = require('xml2js');
const { PrismaClient } = require('@prisma/client');
const { getTeamLogo } = require('../utils/logoMapping');
const prisma = new PrismaClient();

const EUROLEAGUE_API_BASE = 'https://api-live.euroleague.net/v1';

async function fetchEuroleagueSchedule() {
  return await fetchScheduleForLeague('Euroleague', 'EL', 'Europe');
}

async function fetchEurocupSchedule() {
  return await fetchScheduleForLeague('EuroCup', 'EC', 'Europe');
}

async function fetchScheduleForLeague(leagueName, shortName, country) {
  console.log(`  🏀 Fetching ${leagueName} schedule from official XML API...`);
  
  try {
    const response = await axios.get(`${EUROLEAGUE_API_BASE}/schedules`, {
      headers: {
        'User-Agent': 'BasketFlow/1.0'
      },
      timeout: 15000
    });
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const items = result.schedule?.item || [];
    console.log(`  📅 Found ${items.length} ${leagueName} games in XML`);
    
    const league = await prisma.league.upsert({
      where: { name: leagueName },
      update: {},
      create: {
        name: leagueName,
        shortName: shortName,
        country: country
      }
    });
    
    // Fenêtre de 7 jours passés + 21 jours futurs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    endDate.setHours(23, 59, 59, 999);
    
    let matchCount = 0;
    for (const item of items) {
      try {
        const dateStr = item.date?.[0];
        const timeStr = item.startime?.[0];
        const homeTeamName = item.hometeam?.[0];
        const awayTeamName = item.awayteam?.[0];
        const gameCode = item.gamecode?.[0];
        const homeScoreRaw = item.homescore?.[0];
        const awayScoreRaw = item.awayscore?.[0];
        
        if (!homeTeamName || !awayTeamName || !dateStr) {
          continue;
        }
        
        // Parse date and subtract 2 hours to correct timezone
        const gameDate = new Date(`${dateStr} ${timeStr || '20:00'}`);
        gameDate.setHours(gameDate.getHours() - 2);
        
        if (isNaN(gameDate.getTime())) {
          continue;
        }
        
        // Filtrer par fenêtre de dates (7 jours passés + 21 jours futurs)
        if (gameDate < startDate || gameDate > endDate) {
          continue;
        }
        
        // Déterminer le statut et les scores
        const isPast = gameDate < today;
        const homeScore = homeScoreRaw ? parseInt(homeScoreRaw) : null;
        const awayScore = awayScoreRaw ? parseInt(awayScoreRaw) : null;
        const status = isPast ? 'finished' : 'scheduled';
        
        let homeTeam = await prisma.team.findFirst({
          where: { name: homeTeamName }
        });
        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: { name: homeTeamName, logo: getTeamLogo(homeTeamName) }
          });
        }

        let awayTeam = await prisma.team.findFirst({
          where: { name: awayTeamName }
        });
        if (!awayTeam) {
          awayTeam = await prisma.team.create({
            data: { name: awayTeamName, logo: getTeamLogo(awayTeamName) }
          });
        }

        const externalId = `${leagueName.toLowerCase()}-${gameCode || gameDate.getTime()}`;
        
        await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: gameDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            homeScore: homeScore,
            awayScore: awayScore,
            status: status
          },
          create: {
            externalId,
            dateTime: gameDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            homeScore: homeScore,
            awayScore: awayScore,
            status: status
          }
        });

        // Broadcasters will be added by Gemini enrichment
        
        matchCount++;
      } catch (err) {
        console.log('     ⚠️  Error saving game:', err.message);
      }
    }
    
    console.log(`  ✅ ${leagueName}: Saved ${matchCount} matches (last 7 days + next 21 days)`);
    return matchCount;
    
  } catch (error) {
    console.error(`  ❌ ${leagueName} API error:`, error.message);
    return 0;
  }
}

module.exports = {
  fetchEuroleagueSchedule,
  fetchEurocupSchedule
};
