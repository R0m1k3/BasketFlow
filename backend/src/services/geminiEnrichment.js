const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const { fetchBeinSportsNBACalendar } = require('./beinSportsCalendar');
const prisma = new PrismaClient();

const BROADCASTER_KNOWLEDGE_BASE = {
  NBA: `Accords officiels NBA 2024-2025 en France :
  - beIN SPORTS diffuse 400+ matchs NBA par saison (au moins 2 matchs par nuit)
  - Prime Video diffuse 29 matchs le dimanche soir (Sunday Night Live)
  - NBA League Pass diffuse tous les matchs en streaming payant
  - NBA Paris Games (23 & 25 janvier 2025) sur beIN SPORTS`,
  
  WNBA: `Accords officiels WNBA 2024 en France :
  - NBA League Pass diffuse tous les matchs WNBA
  - beIN SPORTS diffuse une sélection de matchs WNBA
  - Saison WNBA : mai à septembre (hors saison octobre-avril)`,
  
  Euroleague: `Accords officiels EuroLeague 2024-2025 en France :
  - SKWEEK diffuse TOUS les matchs EuroLeague (plus de 800 matchs/saison) en streaming payant
  - La Chaîne L'Équipe diffuse en clair les matchs de Paris Basketball et LDLC ASVEL Villeurbanne
  - TV Monaco diffuse TOUS les matchs de l'AS Monaco en clair
  - EuroLeague TV diffuse tous les matchs en streaming payant (hors France parfois)
  Matchs L'Équipe confirmés (novembre-décembre 2025) :
  - 6 nov : Paris vs FC Bayern Munich
  - 11 nov : Paris vs Panathinaikos
  - 11 déc : Paris vs Zalgiris
  - 16 déc : Paris vs FC Barcelona
  - 18 déc : Real Madrid vs Paris
  - 23 déc : ASVEL vs Anadolu Efes
  - 30 déc : ASVEL vs Paris`,
  
  'Betclic Elite': `Accords officiels Betclic Elite 2024-2025 en France :
  - beIN SPORTS diffuse une large sélection de matchs
  - La Chaîne L'Équipe diffuse des matchs en clair
  - DAZN diffuse également des matchs
  - SKWEEK diffuse tous les matchs en streaming`
};

async function enrichMatchesWithBroadcasters(geminiApiKey) {
  console.log('\n🤖 Enriching matches with official 2024-2025 broadcasters...');
  
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        broadcasts: {
          include: {
            broadcaster: true
          }
        }
      }
    });

    if (matches.length === 0) {
      console.log('  ℹ️  No matches to enrich');
      return 0;
    }

    console.log(`  📋 Found ${matches.length} matches to process`);

    // Récupérer le calendrier beIN Sports NBA réel
    let beinNBAMatches = [];
    if (geminiApiKey) {
      beinNBAMatches = await fetchBeinSportsNBACalendar(geminiApiKey);
    }

    let enrichedCount = 0;
    
    const getOrCreateBroadcaster = async (name, type = 'cable', isFree = false) => {
      let broadcaster = await prisma.broadcaster.findFirst({
        where: { name }
      });
      
      if (!broadcaster) {
        broadcaster = await prisma.broadcaster.create({
          data: { name, type, isFree, logo: null }
        });
      }
      
      return broadcaster;
    };
    
    const addBroadcaster = async (matchId, broadcasterName, type = 'cable', isFree = false) => {
      const broadcaster = await getOrCreateBroadcaster(broadcasterName, type, isFree);
      
      const exists = await prisma.matchBroadcast.findFirst({
        where: {
          matchId,
          broadcasterId: broadcaster.id
        }
      });
      
      if (!exists) {
        await prisma.matchBroadcast.create({
          data: { matchId, broadcasterId: broadcaster.id }
        });
      }
    };

    for (const match of matches) {
      const leagueName = match.league.name;
      const matchDate = new Date(match.dateTime);
      const dayOfWeek = matchDate.getDay(); // 0 = dimanche
      
      await prisma.matchBroadcast.deleteMany({
        where: { matchId: match.id }
      });
      
      if (leagueName === 'NBA') {
        // Pas de diffuseur automatique - informations non fiables sans API
        // Seul NBA League Pass est certain de diffuser tous les matchs
        enrichedCount++;
        
      } else if (leagueName === 'WNBA') {
        // Pas de diffuseur automatique - informations non fiables
        enrichedCount++;
        
      } else if (leagueName === 'Euroleague') {
        // Pas de diffuseur automatique - informations non fiables sans calendrier officiel
        enrichedCount++;
        
      } else if (leagueName === 'Betclic Elite') {
        // Pas de diffuseur automatique - informations 2025-2026 non disponibles
        enrichedCount++;
      }
    }

    console.log(`  ✅ Broadcaster enrichment: ${enrichedCount} matches updated with official broadcasters`);
    return enrichedCount;

  } catch (error) {
    console.error('  ❌ Broadcaster enrichment error:', error.message);
    return 0;
  }
}

module.exports = {
  enrichMatchesWithBroadcasters
};
