const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BROADCASTER_MAP = {
  'Euroleague': ['SKWEEK', 'La Chaîne L\'Équipe'],
  'EuroCup': ['SKWEEK'],
  'Betclic Elite': ['beIN Sports', 'La Chaîne L\'Équipe', 'DAZN'],
  'BCL': ['Courtside 1891']
};

function getBroadcasterType(name) {
  const typeMap = {
    'SKWEEK': 'streaming',
    'beIN Sports': 'cable',
    'La Chaîne L\'Équipe': 'cable',
    'DAZN': 'streaming',
    'Courtside 1891': 'streaming',
    'Prime Video': 'streaming'
  };
  return typeMap[name] || 'streaming';
}

async function scrapeEuroleague() {
  console.log('  🕷️  Scraping Euroleague...');
  
  try {
    const response = await axios.get('https://www.euroleaguebasketball.net/euroleague/game-center/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const matches = [];
    
    const league = await prisma.league.upsert({
      where: { name: 'Euroleague' },
      update: {},
      create: { name: 'Euroleague', shortName: 'EL', country: 'Europe' }
    });

    const broadcasters = await Promise.all(
      BROADCASTER_MAP['Euroleague'].map(name =>
        prisma.broadcaster.upsert({
          where: { name },
          update: {},
          create: { 
            name, 
            type: getBroadcasterType(name),
            isFree: name === 'La Chaîne L\'Équipe' 
          }
        })
      )
    );

    $('.game, .match, [data-game]').each((i, elem) => {
      try {
        const $elem = $(elem);
        const dateStr = $elem.find('.date, .game-date, [data-date]').first().text().trim();
        const homeTeam = $elem.find('.home, .team-home, .team-a').first().text().trim();
        const awayTeam = $elem.find('.away, .team-away, .team-b').first().text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          const matchDate = new Date(dateStr);
          if (!isNaN(matchDate.getTime())) {
            matches.push({
              homeTeamName: homeTeam,
              awayTeamName: awayTeam,
              dateTime: matchDate,
              leagueId: league.id,
              broadcasterIds: broadcasters.map(b => b.id)
            });
          }
        }
      } catch (err) {
        console.log('     ⚠️  Skipped invalid match element');
      }
    });

    console.log(`     ℹ️  Found ${matches.length} potential matches in HTML`);
    
    if (matches.length > 0) {
      for (const match of matches) {
        const homeTeam = await prisma.team.upsert({
          where: { name: match.homeTeamName },
          update: {},
          create: { name: match.homeTeamName, logoUrl: null }
        });

        const awayTeam = await prisma.team.upsert({
          where: { name: match.awayTeamName },
          update: {},
          create: { name: match.awayTeamName, logoUrl: null }
        });

        const externalId = `scraper-euroleague-${match.dateTime.toISOString()}-${homeTeam.id}-${awayTeam.id}`;
        
        const createdMatch = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId
          },
          create: {
            externalId,
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId,
            homeScore: null,
            awayScore: null,
            status: 'scheduled'
          }
        });

        await prisma.matchBroadcast.deleteMany({
          where: { matchId: createdMatch.id }
        });

        await Promise.all(
          match.broadcasterIds.map(broadcasterId =>
            prisma.matchBroadcast.create({
              data: {
                matchId: createdMatch.id,
                broadcasterId,
                isFree: broadcasters.find(b => b.id === broadcasterId)?.isFree || false
              }
            })
          )
        );
      }
    }

    return matches.length;
  } catch (error) {
    console.log('     ❌ Euroleague scraping failed:', error.message);
    return 0;
  }
}

async function scrapeEuroCup() {
  console.log('  🕷️  Scraping EuroCup...');
  
  try {
    const response = await axios.get('https://www.euroleaguebasketball.net/eurocup/game-center/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const matches = [];
    
    const league = await prisma.league.upsert({
      where: { name: 'EuroCup' },
      update: {},
      create: { name: 'EuroCup', shortName: 'EC', country: 'Europe' }
    });

    const broadcasters = await Promise.all(
      BROADCASTER_MAP['EuroCup'].map(name =>
        prisma.broadcaster.upsert({
          where: { name },
          update: {},
          create: { 
            name, 
            type: getBroadcasterType(name),
            isFree: false 
          }
        })
      )
    );

    $('.game, .match, [data-game]').each((i, elem) => {
      try {
        const $elem = $(elem);
        const dateStr = $elem.find('.date, .game-date, [data-date]').first().text().trim();
        const homeTeam = $elem.find('.home, .team-home, .team-a').first().text().trim();
        const awayTeam = $elem.find('.away, .team-away, .team-b').first().text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          const matchDate = new Date(dateStr);
          if (!isNaN(matchDate.getTime())) {
            matches.push({
              homeTeamName: homeTeam,
              awayTeamName: awayTeam,
              dateTime: matchDate,
              leagueId: league.id,
              broadcasterIds: broadcasters.map(b => b.id)
            });
          }
        }
      } catch (err) {
        console.log('     ⚠️  Skipped invalid match element');
      }
    });

    console.log(`     ℹ️  Found ${matches.length} potential matches in HTML`);
    
    if (matches.length > 0) {
      for (const match of matches) {
        const homeTeam = await prisma.team.upsert({
          where: { name: match.homeTeamName },
          update: {},
          create: { name: match.homeTeamName, logoUrl: null }
        });

        const awayTeam = await prisma.team.upsert({
          where: { name: match.awayTeamName },
          update: {},
          create: { name: match.awayTeamName, logoUrl: null }
        });

        const externalId = `scraper-eurocup-${match.dateTime.toISOString()}-${homeTeam.id}-${awayTeam.id}`;
        
        const createdMatch = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId
          },
          create: {
            externalId,
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId,
            homeScore: null,
            awayScore: null,
            status: 'scheduled'
          }
        });

        await prisma.matchBroadcast.deleteMany({
          where: { matchId: createdMatch.id }
        });

        await Promise.all(
          match.broadcasterIds.map(broadcasterId =>
            prisma.matchBroadcast.create({
              data: {
                matchId: createdMatch.id,
                broadcasterId,
                isFree: false
              }
            })
          )
        );
      }
    }

    return matches.length;
  } catch (error) {
    console.log('     ❌ EuroCup scraping failed:', error.message);
    return 0;
  }
}

async function scrapeBetclicElite() {
  console.log('  🕷️  Scraping Betclic Elite...');
  
  try {
    const response = await axios.get('https://www.lnb.fr/elite/calendrier/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const matches = [];
    
    const league = await prisma.league.upsert({
      where: { name: 'Betclic Elite' },
      update: {},
      create: { name: 'Betclic Elite', shortName: 'BET', country: 'France' }
    });

    const broadcasters = await Promise.all(
      BROADCASTER_MAP['Betclic Elite'].map(name =>
        prisma.broadcaster.upsert({
          where: { name },
          update: {},
          create: { 
            name, 
            type: getBroadcasterType(name),
            isFree: name === 'La Chaîne L\'Équipe'
          }
        })
      )
    );

    $('.match, .game, .calendar-item, [data-match]').each((i, elem) => {
      try {
        const $elem = $(elem);
        const dateStr = $elem.find('.date, .match-date, time').first().text().trim() || 
                       $elem.find('[datetime]').first().attr('datetime');
        const homeTeam = $elem.find('.home, .team-home, .domicile').first().text().trim();
        const awayTeam = $elem.find('.away, .team-away, .exterieur').first().text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          const matchDate = new Date(dateStr);
          if (!isNaN(matchDate.getTime())) {
            matches.push({
              homeTeamName: homeTeam,
              awayTeamName: awayTeam,
              dateTime: matchDate,
              leagueId: league.id,
              broadcasterIds: broadcasters.map(b => b.id)
            });
          }
        }
      } catch (err) {
        console.log('     ⚠️  Skipped invalid match element');
      }
    });

    console.log(`     ℹ️  Found ${matches.length} potential matches in HTML`);
    
    if (matches.length > 0) {
      for (const match of matches) {
        const homeTeam = await prisma.team.upsert({
          where: { name: match.homeTeamName },
          update: {},
          create: { name: match.homeTeamName, logoUrl: null }
        });

        const awayTeam = await prisma.team.upsert({
          where: { name: match.awayTeamName },
          update: {},
          create: { name: match.awayTeamName, logoUrl: null }
        });

        const externalId = `scraper-betclic-${match.dateTime.toISOString()}-${homeTeam.id}-${awayTeam.id}`;
        
        const createdMatch = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId
          },
          create: {
            externalId,
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId,
            homeScore: null,
            awayScore: null,
            status: 'scheduled'
          }
        });

        await prisma.matchBroadcast.deleteMany({
          where: { matchId: createdMatch.id }
        });

        await Promise.all(
          match.broadcasterIds.map(broadcasterId =>
            prisma.matchBroadcast.create({
              data: {
                matchId: createdMatch.id,
                broadcasterId,
                isFree: broadcasters.find(b => b.id === broadcasterId)?.isFree || false
              }
            })
          )
        );
      }
    }

    return matches.length;
  } catch (error) {
    console.log('     ❌ Betclic Elite scraping failed:', error.message);
    return 0;
  }
}

async function scrapeBCL() {
  console.log('  🕷️  Scraping BCL...');
  
  try {
    const response = await axios.get('https://www.championsleague.basketball/schedule', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const matches = [];
    
    const league = await prisma.league.upsert({
      where: { name: 'BCL' },
      update: {},
      create: { name: 'BCL', shortName: 'BCL', country: 'Europe' }
    });

    const broadcasters = await Promise.all(
      BROADCASTER_MAP['BCL'].map(name =>
        prisma.broadcaster.upsert({
          where: { name },
          update: {},
          create: { 
            name, 
            type: getBroadcasterType(name),
            isFree: false 
          }
        })
      )
    );

    $('.game, .match, .schedule-item, [data-game]').each((i, elem) => {
      try {
        const $elem = $(elem);
        const dateStr = $elem.find('.date, .game-date, time').first().text().trim() ||
                       $elem.find('[datetime]').first().attr('datetime');
        const homeTeam = $elem.find('.home, .team-home, .team-a').first().text().trim();
        const awayTeam = $elem.find('.away, .team-away, .team-b').first().text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          const matchDate = new Date(dateStr);
          if (!isNaN(matchDate.getTime())) {
            matches.push({
              homeTeamName: homeTeam,
              awayTeamName: awayTeam,
              dateTime: matchDate,
              leagueId: league.id,
              broadcasterIds: broadcasters.map(b => b.id)
            });
          }
        }
      } catch (err) {
        console.log('     ⚠️  Skipped invalid match element');
      }
    });

    console.log(`     ℹ️  Found ${matches.length} potential matches in HTML`);
    
    if (matches.length > 0) {
      for (const match of matches) {
        const homeTeam = await prisma.team.upsert({
          where: { name: match.homeTeamName },
          update: {},
          create: { name: match.homeTeamName, logoUrl: null }
        });

        const awayTeam = await prisma.team.upsert({
          where: { name: match.awayTeamName },
          update: {},
          create: { name: match.awayTeamName, logoUrl: null }
        });

        const externalId = `scraper-bcl-${match.dateTime.toISOString()}-${homeTeam.id}-${awayTeam.id}`;
        
        const createdMatch = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId
          },
          create: {
            externalId,
            dateTime: match.dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: match.leagueId,
            homeScore: null,
            awayScore: null,
            status: 'scheduled'
          }
        });

        await prisma.matchBroadcast.deleteMany({
          where: { matchId: createdMatch.id }
        });

        await Promise.all(
          match.broadcasterIds.map(broadcasterId =>
            prisma.matchBroadcast.create({
              data: {
                matchId: createdMatch.id,
                broadcasterId,
                isFree: false
              }
            })
          )
        );
      }
    }

    return matches.length;
  } catch (error) {
    console.log('     ❌ BCL scraping failed:', error.message);
    return 0;
  }
}

async function cleanOldScraperMatches() {
  try {
    const result = await prisma.match.deleteMany({
      where: {
        externalId: {
          startsWith: 'scraper-'
        }
      }
    });
    console.log(`🧹 Cleaned ${result.count} old scraper matches`);
  } catch (error) {
    console.log('⚠️  Error cleaning old matches:', error.message);
  }
}

async function runAllScrapers() {
  console.log('🕷️  Running web scrapers...\n');
  
  await cleanOldScraperMatches();
  
  const euroleagueCount = await scrapeEuroleague();
  const eurocupCount = await scrapeEuroCup();
  const betclicCount = await scrapeBetclicElite();
  const bclCount = await scrapeBCL();
  
  const total = euroleagueCount + eurocupCount + betclicCount + bclCount;
  
  console.log(`\n📊 Scraping complete: ${total} total matches`);
  console.log(`   - Euroleague: ${euroleagueCount}`);
  console.log(`   - EuroCup: ${eurocupCount}`);
  console.log(`   - Betclic Elite: ${betclicCount}`);
  console.log(`   - BCL: ${bclCount}`);
  
  return total;
}

module.exports = {
  runAllScrapers,
  scrapeEuroleague,
  scrapeEuroCup,
  scrapeBetclicElite,
  scrapeBCL
};
