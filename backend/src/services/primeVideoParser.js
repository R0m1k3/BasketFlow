const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parsePrimeVideoSchedule(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const matches = [];
  const monthMap = {
    'octobre': 10, 'novembre': 11, 'décembre': 12,
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4
  };
  
  let currentMonth = null;
  let currentYear = 2025;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (Object.keys(monthMap).some(month => trimmed.toLowerCase().includes(month))) {
      const monthName = Object.keys(monthMap).find(m => trimmed.toLowerCase().includes(m));
      currentMonth = monthMap[monthName];
      // Janvier-Avril = 2026 (fin de saison)
      if (currentMonth <= 4) currentYear = 2026;
      // Octobre-Décembre = 2025 (début de saison)
      else currentYear = 2025;
    }
    
    const matchRegex = /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+(\d+)\s+\w+\s*:\s*(.+?)\s+vs\.?\s+(.+?)\s+-\s+(\d+)h(\d+)/i;
    const match = trimmed.match(matchRegex);
    
    if (match && currentMonth) {
      const [, , day, homeTeam, awayTeam, hour, minute] = match;
      
      const dateTime = new Date(currentYear, currentMonth - 1, parseInt(day), parseInt(hour), parseInt(minute));
      
      matches.push({
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        dateTime: dateTime
      });
    }
  }
  
  return matches;
}

function normalizeTeamName(name) {
  const teamMap = {
    'Boston Celtics': ['Boston', 'Celtics'],
    'New York Knicks': ['New York', 'Knicks'],
    'Minnesota Timberwolves': ['Minnesota', 'Timberwolves'],
    'Los Angeles Lakers': ['Los Angeles Lakers', 'Lakers', 'LA Lakers'],
    'Brooklyn Nets': ['Brooklyn', 'Nets'],
    'San Antonio Spurs': ['San Antonio', 'Spurs'],
    'Philadelphia 76ers': ['Philadelphia', '76ers'],
    'Memphis Grizzlies': ['Memphis', 'Grizzlies'],
    'New Orleans Pelicans': ['New Orleans', 'Pelicans'],
    'Oklahoma City Thunder': ['Oklahoma City', 'Thunder'],
    'Houston Rockets': ['Houston', 'Rockets'],
    'Golden State Warriors': ['Golden State', 'Warriors'],
    'Milwaukee Bucks': ['Milwaukee', 'Bucks'],
    'Miami Heat': ['Miami'],
    'Sacramento Kings': ['Sacramento', 'Kings'],
    'Indiana Pacers': ['Indiana', 'Pacers'],
    'Cleveland Cavaliers': ['Cleveland', 'Cavaliers'],
    'Denver Nuggets': ['Denver', 'Nuggets'],
    'Dallas Mavericks': ['Dallas', 'Mavericks'],
    'Utah Jazz': ['Utah', 'Jazz'],
    'Toronto Raptors': ['Toronto', 'Raptors'],
    'Chicago Bulls': ['Chicago', 'Bulls'],
    'Atlanta Hawks': ['Atlanta', 'Hawks'],
    'Washington Wizards': ['Washington', 'Wizards'],
    'Portland Trail Blazers': ['Portland', 'Trail Blazers'],
    'Orlando Magic': ['Orlando', 'Magic'],
    'Detroit Pistons': ['Detroit', 'Pistons'],
    'Charlotte Hornets': ['Charlotte', 'Hornets'],
    'Los Angeles Clippers': ['Los Angeles Clippers', 'Clippers', 'LA Clippers']
  };
  
  for (const [fullName, variations] of Object.entries(teamMap)) {
    if (variations.some(v => name.includes(v) || v.includes(name))) {
      return fullName;
    }
  }
  
  return name;
}

async function enrichWithPrimeVideo() {
  try {
    const filePath = path.join(__dirname, '../../..', 'attached_assets', 
      'Pasted-Le-programme-des-matchs-sur-Prime-Vid-o-Octobre-Samedi-25-octobre-Boston-Celtics-vs-New-York--1760682479365_1760682479365.txt');
    
    if (!fs.existsSync(filePath)) {
      console.log('  ℹ️  Prime Video schedule file not found (optional - skipping)');
      return 0;
    }
    
    const primeMatches = parsePrimeVideoSchedule(filePath);
    console.log(`📺 Calendrier Prime Video: ${primeMatches.length} matchs trouvés`);
    
    const primeBroadcaster = await prisma.broadcaster.upsert({
      where: { name: 'Prime Video' },
      update: {},
      create: {
        name: 'Prime Video',
        type: 'streaming',
        isFree: false,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg'
      }
    });
    
    let enrichedCount = 0;
    
    for (const pm of primeMatches) {
      const normalizedHome = normalizeTeamName(pm.homeTeam);
      const normalizedAway = normalizeTeamName(pm.awayTeam);
      
      const matchDateStart = new Date(pm.dateTime);
      matchDateStart.setHours(matchDateStart.getHours() - 2);
      const matchDateEnd = new Date(pm.dateTime);
      matchDateEnd.setHours(matchDateEnd.getHours() + 2);
      
      const dbMatches = await prisma.match.findMany({
        where: {
          league: { name: 'NBA' },
          dateTime: {
            gte: matchDateStart,
            lte: matchDateEnd
          }
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          broadcasts: {
            include: { broadcaster: true }
          }
        }
      });
      
      const match = dbMatches.find(m => {
        const homeMatch = m.homeTeam.name.includes(normalizedHome) || normalizedHome.includes(m.homeTeam.name);
        const awayMatch = m.awayTeam.name.includes(normalizedAway) || normalizedAway.includes(m.awayTeam.name);
        return homeMatch && awayMatch;
      });
      
      if (match) {
        const alreadyHasPrime = match.broadcasts.some(b => b.broadcaster.name === 'Prime Video');
        
        if (!alreadyHasPrime) {
          await prisma.matchBroadcast.create({
            data: {
              matchId: match.id,
              broadcasterId: primeBroadcaster.id
            }
          });
          enrichedCount++;
          console.log(`  ✅ ${normalizedHome} vs ${normalizedAway} → Prime Video ajouté`);
        }
      } else {
        console.log(`  ⚠️  Match non trouvé: ${normalizedHome} vs ${normalizedAway} (${pm.dateTime.toISOString()})`);
      }
    }
    
    console.log(`\n✅ Prime Video enrichment: ${enrichedCount} matchs enrichis`);
    return enrichedCount;
    
  } catch (error) {
    console.error('❌ Erreur Prime Video enrichment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  enrichWithPrimeVideo,
  parsePrimeVideoSchedule
};
