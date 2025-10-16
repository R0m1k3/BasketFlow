const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SPORTS_DB_API = 'https://www.thesportsdb.com/api/v1/json/3';
const FRENCH_LNB_ID = '4423';

const BROADCASTERS = [
  { name: 'beIN Sports', type: 'cable', isFree: false },
  { name: 'La Chaîne L\'Équipe', type: 'cable', isFree: true },
  { name: 'DAZN', type: 'streaming', isFree: false }
];

async function fetchBetclicEliteSchedule() {
  console.log('  🏀 Fetching Betclic Elite schedule from TheSportsDB...');
  
  try {
    const response = await axios.get(`${SPORTS_DB_API}/eventsnextleague.php`, {
      params: { id: FRENCH_LNB_ID },
      timeout: 15000
    });

    const events = response.data?.events || [];
    console.log(`  📅 Found ${events.length} Betclic Elite events from API`);
    
    const league = await prisma.league.upsert({
      where: { name: 'Betclic Elite' },
      update: {},
      create: {
        name: 'Betclic Elite',
        shortName: 'BET',
        country: 'France'
      }
    });

    const broadcasters = await Promise.all(
      BROADCASTERS.map(b =>
        prisma.broadcaster.upsert({
          where: { name: b.name },
          update: {},
          create: b
        })
      )
    );

    let savedCount = 0;

    for (const event of events) {
      try {
        const homeTeamName = event.strHomeTeam;
        const awayTeamName = event.strAwayTeam;
        const dateStr = event.dateEvent;
        const timeStr = event.strTime || '20:00';
        const eventId = event.idEvent;
        
        if (!homeTeamName || !awayTeamName || !dateStr) {
          continue;
        }

        const eventDateTime = new Date(`${dateStr}T${timeStr}`);
        if (isNaN(eventDateTime.getTime())) {
          continue;
        }

        let homeTeam = await prisma.team.findFirst({
          where: { name: homeTeamName }
        });
        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: { name: homeTeamName, logo: event.strHomeTeamBadge }
          });
        }

        let awayTeam = await prisma.team.findFirst({
          where: { name: awayTeamName }
        });
        if (!awayTeam) {
          awayTeam = await prisma.team.create({
            data: { name: awayTeamName, logo: event.strAwayTeamBadge }
          });
        }

        const externalId = `betclic-${eventId || eventDateTime.getTime()}`;
        
        const homeScore = event.intHomeScore ? parseInt(event.intHomeScore) : null;
        const awayScore = event.intAwayScore ? parseInt(event.intAwayScore) : null;
        const status = homeScore !== null ? 'final' : 'scheduled';

        const match = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: eventDateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            homeScore,
            awayScore,
            status
          },
          create: {
            externalId,
            dateTime: eventDateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            homeScore,
            awayScore,
            status
          }
        });

        await prisma.matchBroadcast.deleteMany({
          where: { matchId: match.id }
        });

        await Promise.all(
          broadcasters.map(broadcaster =>
            prisma.matchBroadcast.create({
              data: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            })
          )
        );

        savedCount++;
      } catch (err) {
        console.log('     ⚠️  Error saving event:', err.message);
      }
    }

    console.log(`  ✅ Betclic Elite: Saved ${savedCount} matches`);
    return savedCount;
  } catch (error) {
    console.error('  ❌ Betclic Elite API error:', error.message);
    return 0;
  }
}

async function cleanOldBetclicMatches() {
  try {
    const result = await prisma.match.deleteMany({
      where: {
        externalId: {
          startsWith: 'betclic-'
        }
      }
    });
    console.log(`🧹 Cleaned ${result.count} old Betclic Elite matches`);
  } catch (error) {
    console.log('⚠️  Error cleaning old matches:', error.message);
  }
}

module.exports = {
  fetchBetclicEliteSchedule,
  cleanOldBetclicMatches
};
