const puppeteer = require('puppeteer-core');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const BROWSERLESS_BASE = 'browserless.vonrodbox.eu';

// Try different endpoint patterns
function getBrowserlessURL() {
  if (!BROWSERLESS_TOKEN) {
    throw new Error('BROWSERLESS_TOKEN not configured');
  }
  // Standard Browserless endpoint pattern
  return `wss://${BROWSERLESS_BASE}?token=${BROWSERLESS_TOKEN}`;
}

// Broadcaster mapping
const BROADCASTER_MAP = {
  'Euroleague': ['SKWEEK', 'La Chaîne L\'Équipe'],
  'EuroCup': ['SKWEEK'],
  'Betclic Elite': ['beIN Sports', 'La Chaîne L\'Équipe', 'DAZN'],
  'BCL': ['Courtside 1891']
};

async function scrapeEuroleague() {
  console.log('  🕷️  Scraping Euroleague...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserlessURL()
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.euroleaguebasketball.net/euroleague/schedule/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for games to load
    await page.waitForSelector('.game', { timeout: 10000 });
    
    const games = await page.evaluate(() => {
      const gameElements = document.querySelectorAll('.game');
      const results = [];
      
      gameElements.forEach(game => {
        const homeTeam = game.querySelector('.home-team')?.textContent?.trim();
        const awayTeam = game.querySelector('.away-team')?.textContent?.trim();
        const dateStr = game.querySelector('.game-date')?.textContent?.trim();
        const timeStr = game.querySelector('.game-time')?.textContent?.trim();
        
        if (homeTeam && awayTeam && dateStr) {
          results.push({
            homeTeam,
            awayTeam,
            dateStr,
            timeStr
          });
        }
      });
      
      return results;
    });
    
    let saved = 0;
    for (const game of games) {
      try {
        const gameDate = parseEuroleagueDate(game.dateStr, game.timeStr);
        if (gameDate && gameDate >= new Date() && gameDate <= getEndDate()) {
          await saveGame(game.homeTeam, game.awayTeam, gameDate, 'Euroleague');
          saved++;
        }
      } catch (err) {
        console.error(`     ⚠️  Error saving Euroleague game:`, err.message);
      }
    }
    
    console.log(`     ✓ Euroleague: ${saved} matches saved`);
    await browser.close();
    return saved;
    
  } catch (error) {
    console.error('     ❌ Euroleague scraping failed:', error.message);
    if (browser) await browser.close();
    return 0;
  }
}

async function scrapeBetclicElite() {
  console.log('  🕷️  Scraping Betclic Elite...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserlessURL()
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.lnb.fr/elite/calendrier/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('.match-item', { timeout: 10000 });
    
    const games = await page.evaluate(() => {
      const matchElements = document.querySelectorAll('.match-item');
      const results = [];
      
      matchElements.forEach(match => {
        const homeTeam = match.querySelector('.team-home')?.textContent?.trim();
        const awayTeam = match.querySelector('.team-away')?.textContent?.trim();
        const dateStr = match.querySelector('.match-date')?.textContent?.trim();
        
        if (homeTeam && awayTeam && dateStr) {
          results.push({
            homeTeam,
            awayTeam,
            dateStr
          });
        }
      });
      
      return results;
    });
    
    let saved = 0;
    for (const game of games) {
      try {
        const gameDate = parseLNBDate(game.dateStr);
        if (gameDate && gameDate >= new Date() && gameDate <= getEndDate()) {
          await saveGame(game.homeTeam, game.awayTeam, gameDate, 'Betclic Elite');
          saved++;
        }
      } catch (err) {
        console.error(`     ⚠️  Error saving Betclic Elite game:`, err.message);
      }
    }
    
    console.log(`     ✓ Betclic Elite: ${saved} matches saved`);
    await browser.close();
    return saved;
    
  } catch (error) {
    console.error('     ❌ Betclic Elite scraping failed:', error.message);
    if (browser) await browser.close();
    return 0;
  }
}

async function scrapeEurocup() {
  console.log('  🕷️  Scraping EuroCup...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserlessURL()
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.eurocupbasketball.com/eurocup/schedule/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('.game', { timeout: 10000 });
    
    const games = await page.evaluate(() => {
      const gameElements = document.querySelectorAll('.game');
      const results = [];
      
      gameElements.forEach(game => {
        const homeTeam = game.querySelector('.home-team')?.textContent?.trim();
        const awayTeam = game.querySelector('.away-team')?.textContent?.trim();
        const dateStr = game.querySelector('.game-date')?.textContent?.trim();
        const timeStr = game.querySelector('.game-time')?.textContent?.trim();
        
        if (homeTeam && awayTeam && dateStr) {
          results.push({
            homeTeam,
            awayTeam,
            dateStr,
            timeStr
          });
        }
      });
      
      return results;
    });
    
    let saved = 0;
    for (const game of games) {
      try {
        const gameDate = parseEuroleagueDate(game.dateStr, game.timeStr);
        if (gameDate && gameDate >= new Date() && gameDate <= getEndDate()) {
          await saveGame(game.homeTeam, game.awayTeam, gameDate, 'EuroCup');
          saved++;
        }
      } catch (err) {
        console.error(`     ⚠️  Error saving EuroCup game:`, err.message);
      }
    }
    
    console.log(`     ✓ EuroCup: ${saved} matches saved`);
    await browser.close();
    return saved;
    
  } catch (error) {
    console.error('     ❌ EuroCup scraping failed:', error.message);
    if (browser) await browser.close();
    return 0;
  }
}

async function scrapeBCL() {
  console.log('  🕷️  Scraping BCL...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserlessURL()
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.championsleague.basketball/schedule', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('.match', { timeout: 10000 });
    
    const games = await page.evaluate(() => {
      const matchElements = document.querySelectorAll('.match');
      const results = [];
      
      matchElements.forEach(match => {
        const homeTeam = match.querySelector('.team-a')?.textContent?.trim();
        const awayTeam = match.querySelector('.team-b')?.textContent?.trim();
        const dateStr = match.querySelector('.date')?.textContent?.trim();
        
        if (homeTeam && awayTeam && dateStr) {
          results.push({
            homeTeam,
            awayTeam,
            dateStr
          });
        }
      });
      
      return results;
    });
    
    let saved = 0;
    for (const game of games) {
      try {
        const gameDate = parseBCLDate(game.dateStr);
        if (gameDate && gameDate >= new Date() && gameDate <= getEndDate()) {
          await saveGame(game.homeTeam, game.awayTeam, gameDate, 'BCL');
          saved++;
        }
      } catch (err) {
        console.error(`     ⚠️  Error saving BCL game:`, err.message);
      }
    }
    
    console.log(`     ✓ BCL: ${saved} matches saved`);
    await browser.close();
    return saved;
    
  } catch (error) {
    console.error('     ❌ BCL scraping failed:', error.message);
    if (browser) await browser.close();
    return 0;
  }
}

async function saveGame(homeTeamName, awayTeamName, gameDate, leagueName) {
  const externalId = `browserless-${leagueName.toLowerCase()}-${gameDate.getTime()}-${homeTeamName}-${awayTeamName}`.replace(/\s+/g, '-');
  
  const league = await prisma.league.upsert({
    where: { name: leagueName },
    update: {},
    create: {
      name: leagueName,
      shortName: getLeagueShortName(leagueName),
      country: getLeagueCountry(leagueName),
      logo: null
    }
  });
  
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
  
  const existingMatch = await prisma.match.findUnique({
    where: { externalId }
  });
  
  if (existingMatch) {
    await prisma.match.update({
      where: { id: existingMatch.id },
      data: {
        dateTime: gameDate,
        status: 'scheduled'
      }
    });
  } else {
    const match = await prisma.match.create({
      data: {
        externalId,
        dateTime: gameDate,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        leagueId: league.id,
        status: 'scheduled',
        homeScore: null,
        awayScore: null
      }
    });
    
    // Add broadcasters
    await addBroadcasters(match.id, leagueName);
  }
}

async function addBroadcasters(matchId, leagueName) {
  const broadcasterNames = BROADCASTER_MAP[leagueName] || [];
  
  for (const broadcasterName of broadcasterNames) {
    let broadcaster = await prisma.broadcaster.findFirst({
      where: { name: broadcasterName }
    });
    
    if (!broadcaster) {
      broadcaster = await prisma.broadcaster.create({
        data: {
          name: broadcasterName,
          logo: null,
          website: null
        }
      });
    }
    
    const existingBroadcast = await prisma.matchBroadcast.findFirst({
      where: {
        matchId: matchId,
        broadcasterId: broadcaster.id
      }
    });
    
    if (!existingBroadcast) {
      await prisma.matchBroadcast.create({
        data: {
          matchId: matchId,
          broadcasterId: broadcaster.id,
          isFree: broadcasterName === 'La Chaîne L\'Équipe'
        }
      });
    }
  }
}

function parseEuroleagueDate(dateStr, timeStr) {
  // Parse format like "16 Oct 2025" + "19:00"
  try {
    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = getMonthNumber(parts[1]);
    const year = parseInt(parts[2] || new Date().getFullYear());
    
    const timeParts = (timeStr || '20:00').split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1] || 0);
    
    return new Date(year, month, day, hours, minutes);
  } catch (e) {
    return null;
  }
}

function parseLNBDate(dateStr) {
  // Parse various French date formats
  try {
    const parts = dateStr.replace(/[,]/g, '').split(' ');
    const day = parseInt(parts[1]);
    const month = getMonthNumber(parts[2]);
    const year = parseInt(parts[3] || new Date().getFullYear());
    
    return new Date(year, month, day, 20, 0);
  } catch (e) {
    return null;
  }
}

function parseBCLDate(dateStr) {
  // Parse BCL date format
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

function getMonthNumber(monthStr) {
  const months = {
    'jan': 0, 'january': 0, 'janvier': 0,
    'feb': 1, 'february': 1, 'février': 1, 'fevrier': 1,
    'mar': 2, 'march': 2, 'mars': 2,
    'apr': 3, 'april': 3, 'avril': 3,
    'may': 4, 'mai': 4,
    'jun': 5, 'june': 5, 'juin': 5,
    'jul': 6, 'july': 6, 'juillet': 6,
    'aug': 7, 'august': 7, 'août': 7, 'aout': 7,
    'sep': 8, 'september': 8, 'septembre': 8,
    'oct': 9, 'october': 9, 'octobre': 9,
    'nov': 10, 'november': 10, 'novembre': 10,
    'dec': 11, 'december': 11, 'décembre': 11, 'decembre': 11
  };
  return months[monthStr.toLowerCase()] || 0;
}

function getEndDate() {
  const end = new Date();
  end.setDate(end.getDate() + 21);
  return end;
}

function getLeagueShortName(leagueName) {
  const map = {
    'Euroleague': 'EL',
    'EuroCup': 'EC',
    'Betclic Elite': 'BE',
    'BCL': 'BCL'
  };
  return map[leagueName] || leagueName.substring(0, 3).toUpperCase();
}

function getLeagueCountry(leagueName) {
  const map = {
    'Euroleague': 'Europe',
    'EuroCup': 'Europe',
    'Betclic Elite': 'France',
    'BCL': 'Europe'
  };
  return map[leagueName] || 'International';
}

module.exports = {
  scrapeEuroleague,
  scrapeBetclicElite,
  scrapeEurocup,
  scrapeBCL
};
