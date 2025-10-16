const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scrapeBCLSchedule() {
  console.log('  🕷️  Scraping BCL schedule from championsleague.basketball...');
  
  try {
    const response = await axios.get('https://www.championsleague.basketball/en/games', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    // Parse games from the schedule page
    $('.game, .fixture, .match').each((i, elem) => {
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
    
    console.log(`  📅 Found ${games.length} BCL games via scraping`);
    
    let matchCount = 0;
    for (const game of games) {
      await saveScrapedBCLMatch(game);
      matchCount++;
    }
    
    console.log(`  ✅ BCL: Saved ${matchCount} matches`);
    return matchCount;
    
  } catch (error) {
    console.error('  ❌ BCL scraping error:', error.message);
    return 0;
  }
}

async function saveScrapedBCLMatch(game) {
  try {
    const gameDateTime = parseDate(game.dateStr);
    if (!gameDateTime) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    
    if (gameDateTime < today || gameDateTime > endDate) return;
    
    const externalId = `bcl-scraped-${game.homeTeam}-${game.awayTeam}-${gameDateTime.getTime()}`;
    
    const league = await prisma.league.upsert({
      where: { name: 'BCL' },
      update: {},
      create: {
        name: 'BCL',
        shortName: 'BCL',
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
    console.error(`    ⚠️  Error saving scraped BCL match:`, error.message);
  }
}

function parseDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      date.setHours(20, 0, 0, 0); // Default time
      return date;
    }
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  scrapeBCLSchedule
};
