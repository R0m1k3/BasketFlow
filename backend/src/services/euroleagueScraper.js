const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scrapeEuroleagueSchedule() {
  console.log('  🕷️  Scraping Euroleague schedule from euroleague.net...');
  
  try {
    const response = await axios.get('https://www.euroleaguebasketball.net/euroleague/schedule/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    
    const games = [];
    
    // Parse games from the schedule page
    $('.game, .game-center, .fixture').each((i, elem) => {
      try {
        const dateStr = $(elem).find('.date, .game-date').text().trim();
        const timeStr = $(elem).find('.time, .game-time').text().trim();
        const homeTeam = $(elem).find('.home-team, .team-a').text().trim();
        const awayTeam = $(elem).find('.away-team, .team-b').text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          games.push({ homeTeam, awayTeam, dateStr, timeStr });
        }
      } catch (err) {
        // Skip malformed entries
      }
    });
    
    console.log(`  📅 Found ${games.length} Euroleague games via scraping`);
    
    let matchCount = 0;
    for (const game of games) {
      await saveScrapedMatch(game, 'Euroleague');
      matchCount++;
    }
    
    console.log(`  ✅ Euroleague: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Euroleague scraping error:', error.message);
    return 0;
  }
}

async function scrapeEurocupSchedule() {
  console.log('  🕷️  Scraping Eurocup schedule from eurocupbasketball.com...');
  
  try {
    const response = await axios.get('https://www.eurocupbasketball.com/eurocup/schedule/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    $('.game, .game-center, .fixture').each((i, elem) => {
      try {
        const dateStr = $(elem).find('.date, .game-date').text().trim();
        const homeTeam = $(elem).find('.home-team, .team-a').text().trim();
        const awayTeam = $(elem).find('.away-team, .team-b').text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          games.push({ homeTeam, awayTeam, dateStr });
        }
      } catch (err) {
        // Skip malformed entries
      }
    });
    
    console.log(`  📅 Found ${games.length} Eurocup games via scraping`);
    
    let matchCount = 0;
    for (const game of games) {
      await saveScrapedMatch(game, 'EuroCup');
      matchCount++;
    }
    
    console.log(`  ✅ Eurocup: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Eurocup scraping error:', error.message);
    return 0;
  }
}

async function saveScrapedMatch(game, leagueName) {
  try {
    const gameDateTime = parseDate(game.dateStr, game.timeStr);
    if (!gameDateTime) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    
    if (gameDateTime < today || gameDateTime > endDate) return;
    
    const externalId = `${leagueName.toLowerCase()}-scraped-${game.homeTeam}-${game.awayTeam}-${gameDateTime.getTime()}`;
    
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
      where: { name: game.homeTeam }
    });
    
    if (!homeTeam) {
      homeTeam = await prisma.team.create({
        data: { name: game.homeTeam, logo: null }
      });
    }
    
    let awayTeam = await prisma.team.findFirst({
      where: { name: game.awayTeam }
    });
    
    if (!awayTeam) {
      awayTeam = await prisma.team.create({
        data: { name: game.awayTeam, logo: null }
      });
    }
    
    const existingMatch = await prisma.match.findUnique({
      where: { externalId }
    });
    
    if (!existingMatch) {
      await prisma.match.create({
        data: {
          externalId,
          dateTime: gameDateTime,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
          status: 'scheduled',
          homeScore: null,
          awayScore: null
        }
      });
    }
  } catch (error) {
    console.error(`    ⚠️  Error saving scraped match:`, error.message);
  }
}

function parseDate(dateStr, timeStr = '20:00') {
  try {
    // Try to parse date in various formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const [hours, minutes] = timeStr.split(':').map(n => parseInt(n) || 20);
      date.setHours(hours, minutes || 0, 0, 0);
      return date;
    }
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  scrapeEuroleagueSchedule,
  scrapeEurocupSchedule
};
