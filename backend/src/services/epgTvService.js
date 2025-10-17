const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EPG_CHANNELS = {
  'beIN Sports 1': 55773,
  'beIN Sports 2': 55774,
  'beIN Sports 3': 55775,
  "La Chaîne L'Équipe": 55938
  // DAZN et TV Monaco à trouver si disponibles
};

const BASKETBALL_KEYWORDS = [
  'basket', 'nba', 'wnba', 'euroleague', 'eurocup', 
  'betclic elite', 'lnb', 'celtics', 'lakers', 'warriors',
  'asvel', 'monaco', 'paris basketball', 'barcelona', 'real madrid'
];

async function fetchEPGPrograms(channelId) {
  try {
    const url = `https://epg.pw/api/epg.json?channel_id=${channelId}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.epg_list) {
      return response.data.epg_list;
    }
    return [];
  } catch (error) {
    console.error(`  ❌ Error fetching EPG for channel ${channelId}:`, error.message);
    return [];
  }
}

function isBasketballProgram(program) {
  const title = (program.title || '').toLowerCase();
  const desc = (program.desc || '').toLowerCase();
  const text = `${title} ${desc}`;
  
  return BASKETBALL_KEYWORDS.some(keyword => text.includes(keyword));
}

function normalizeTeamName(name) {
  const teamMap = {
    // NBA
    'celtics': 'Boston Celtics',
    'lakers': 'Los Angeles Lakers',
    'warriors': 'Golden State Warriors',
    'nets': 'Brooklyn Nets',
    'knicks': 'New York Knicks',
    'heat': 'Miami Heat',
    'bucks': 'Milwaukee Bucks',
    'clippers': 'Los Angeles Clippers',
    'mavs': 'Dallas Mavericks',
    'mavericks': 'Dallas Mavericks',
    // Euroleague
    'asvel': 'LDLC ASVEL VILLEURBANNE',
    'monaco': 'AS MONACO',
    'paris': 'PARIS BASKETBALL',
    'barcelona': 'FC BARCELONA',
    'real madrid': 'REAL MADRID',
    'olympiacos': 'OLYMPIACOS PIRAEUS',
    'fenerbahce': 'FENERBAHCE BEKO ISTANBUL',
    'zalgiris': 'ZALGIRIS KAUNAS',
    'maccabi': 'MACCABI RAMAT GAN TEL AVIV'
  };
  
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(teamMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  return name;
}

async function enrichWithEPGData() {
  try {
    console.log('\n📺 Enriching matches with EPG TV data...');
    
    let totalEnriched = 0;
    
    for (const [channelName, channelId] of Object.entries(EPG_CHANNELS)) {
      console.log(`\n  📡 Fetching ${channelName} (ID: ${channelId})...`);
      
      const programs = await fetchEPGPrograms(channelId);
      const basketPrograms = programs.filter(isBasketballProgram);
      
      console.log(`    Found ${basketPrograms.length} basketball programs`);
      
      // Créer ou récupérer le diffuseur
      const broadcaster = await prisma.broadcaster.upsert({
        where: { name: channelName },
        update: {},
        create: {
          name: channelName,
          type: channelName.includes('beIN') ? 'cable' : 'tnt',
          isFree: channelName.includes("L'Équipe")
        }
      });
      
      for (const program of basketPrograms) {
        const programDate = new Date(program.start_date);
        
        // Chercher un match correspondant dans une fenêtre de ±2 heures
        const matchStartWindow = new Date(programDate);
        matchStartWindow.setHours(matchStartWindow.getHours() - 2);
        const matchEndWindow = new Date(programDate);
        matchEndWindow.setHours(matchEndWindow.getHours() + 2);
        
        const matches = await prisma.match.findMany({
          where: {
            dateTime: {
              gte: matchStartWindow,
              lte: matchEndWindow
            }
          },
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
            broadcasts: {
              include: { broadcaster: true }
            }
          }
        });
        
        // Tenter de matcher avec les équipes mentionnées dans le titre/description
        const programText = `${program.title} ${program.desc || ''}`.toLowerCase();
        
        for (const match of matches) {
          const homeTeam = match.homeTeam.name.toLowerCase();
          const awayTeam = match.awayTeam.name.toLowerCase();
          const league = match.league.name.toLowerCase();
          
          // Vérifier si le programme correspond à ce match
          const homeMatch = programText.includes(homeTeam.split(' ')[0]) || 
                           BASKETBALL_KEYWORDS.some(k => homeTeam.includes(k) && programText.includes(k));
          const awayMatch = programText.includes(awayTeam.split(' ')[0]) ||
                           BASKETBALL_KEYWORDS.some(k => awayTeam.includes(k) && programText.includes(k));
          const leagueMatch = programText.includes(league);
          
          if ((homeMatch && awayMatch) || (leagueMatch && (homeMatch || awayMatch))) {
            // Vérifier si le diffuseur n'est pas déjà associé
            const alreadyHasBroadcaster = match.broadcasts.some(b => b.broadcaster.name === channelName);
            
            if (!alreadyHasBroadcaster) {
              await prisma.matchBroadcast.create({
                data: {
                  matchId: match.id,
                  broadcasterId: broadcaster.id
                }
              });
              
              totalEnriched++;
              console.log(`    ✅ ${match.homeTeam.name} vs ${match.awayTeam.name} → ${channelName}`);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ EPG enrichment completed: ${totalEnriched} matches enriched`);
    return totalEnriched;
    
  } catch (error) {
    console.error('❌ EPG enrichment error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  enrichWithEPGData,
  fetchEPGPrograms,
  EPG_CHANNELS
};
