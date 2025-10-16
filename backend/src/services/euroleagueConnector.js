const axios = require('axios');
const xml2js = require('xml2js');
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
    
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const items = result.schedule?.item || [];
    console.log(`  📅 Found ${items.length} Euroleague games in XML`);
    
    const league = await prisma.league.upsert({
      where: { name: 'Euroleague' },
      update: {},
      create: {
        name: 'Euroleague',
        shortName: 'EL',
        country: 'Europe'
      }
    });
    
    let matchCount = 0;
    for (const item of items) {
      try {
        const dateStr = item.date?.[0];
        const timeStr = item.startime?.[0];
        const homeTeamName = item.hometeam?.[0];
        const awayTeamName = item.awayteam?.[0];
        const gameCode = item.gamecode?.[0];
        
        if (!homeTeamName || !awayTeamName || !dateStr) {
          continue;
        }
        
        // Parse date and subtract 2 hours to correct timezone
        const gameDate = new Date(`${dateStr} ${timeStr || '20:00'}`);
        gameDate.setHours(gameDate.getHours() - 2);
        
        if (isNaN(gameDate.getTime())) {
          continue;
        }
        
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

        const externalId = `euroleague-${gameCode || gameDate.getTime()}`;
        
        await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: gameDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: 'scheduled'
          },
          create: {
            externalId,
            dateTime: gameDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            homeScore: null,
            awayScore: null,
            status: 'scheduled'
          }
        });

        // Broadcasters will be added by Gemini enrichment
        
        matchCount++;
      } catch (err) {
        console.log('     ⚠️  Error saving game:', err.message);
      }
    }
    
    console.log(`  ✅ Euroleague: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Euroleague API error:', error.message);
    return 0;
  }
}

module.exports = {
  fetchEuroleagueSchedule
};
