const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scrapeBetclicEliteSchedule() {
  console.log('  🕷️  Scraping Betclic Elite schedule from lnb.fr...');
  
  try {
    const response = await axios.get('https://www.lnb.fr/elite/calendrier/', {
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
    $('.match, .game, .fixture, .rencontre').each((i, elem) => {
      try {
        const dateStr = $(elem).find('.date, .match-date, .jour').text().trim();
        const timeStr = $(elem).find('.time, .hour, .heure').text().trim();
        const homeTeam = $(elem).find('.home, .domicile, .team-home').text().trim();
        const awayTeam = $(elem).find('.away, .exterieur, .team-away').text().trim();
        
        if (homeTeam && awayTeam && dateStr) {
          games.push({ homeTeam, awayTeam, dateStr, timeStr });
        }
      } catch (err) {
        // Skip malformed entries
      }
    });
    
    console.log(`  📅 Found ${games.length} Betclic Elite games via scraping`);
    
    let matchCount = 0;
    for (const game of games) {
      await saveScrapedLNBMatch(game);
      matchCount++;
    }
    
    console.log(`  ✅ Betclic Elite: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ Betclic Elite scraping error:', error.message);
    return 0;
  }
}

async function saveScrapedLNBMatch(game) {
  try {
    const gameDateTime = parseDate(game.dateStr, game.timeStr);
    if (!gameDateTime) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    
    if (gameDateTime < today || gameDateTime > endDate) return;
    
    const externalId = `betclic-scraped-${game.homeTeam}-${game.awayTeam}-${gameDateTime.getTime()}`;
    
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
    console.error(`    ⚠️  Error saving scraped LNB match:`, error.message);
  }
}

function parseDate(dateStr, timeStr = '20:00') {
  try {
    // Parse French date format (e.g., "Samedi 19 octobre")
    const months = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };
    
    const parts = dateStr.toLowerCase().split(' ');
    const day = parseInt(parts.find(p => !isNaN(parseInt(p))));
    const monthName = parts.find(p => months[p] !== undefined);
    const month = months[monthName];
    
    if (day && month !== undefined) {
      const year = new Date().getFullYear();
      const date = new Date(year, month, day);
      
      const [hours, minutes] = (timeStr || '20:00').split(':').map(n => parseInt(n) || 20);
      date.setHours(hours, minutes || 0, 0, 0);
      
      return date;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  scrapeBetclicEliteSchedule
};
