const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// URLs des calendriers officiels
const PRIME_VIDEO_NBA_URL = 'https://www.primevideo.com/region/eu/offers/nonprimehomepage/ref=dvm_pds_amz_fr_dc_s_g|c_428185243898';
const LEQUIPE_TV_URL = 'https://www.lequipe.fr/programme-tv/';

async function fetchPrimeVideoNBACalendar(geminiApiKey) {
  console.log('  📺 Fetching Prime Video NBA calendar...');
  
  if (!geminiApiKey) {
    console.log('    ⚠️  No Gemini API key, using default Sunday rule');
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Récupérer la page Prime Video
    const response = await axios.get(PRIME_VIDEO_NBA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const prompt = `Tu es un expert en extraction de données. Analyse cette page Prime Video et extrait UNIQUEMENT les matchs NBA programmés.

PAGE HTML (extrait) :
${response.data.substring(0, 50000)}

INSTRUCTIONS :
1. Cherche les matchs NBA avec dates et équipes
2. Format de réponse JSON strict :
[
  {
    "date": "2024-10-20",
    "homeTeam": "Lakers",
    "awayTeam": "Warriors"
  }
]

3. Si AUCUN match trouvé → renvoie []
4. N'invente RIEN - extraction uniquement

RÉPONDS UNIQUEMENT avec le JSON array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('    ℹ️  No Prime Video matches found in page');
      return [];
    }

    const matches = JSON.parse(jsonMatch[0]);
    console.log(`    ✅ Found ${matches.length} Prime Video NBA matches`);
    return matches;

  } catch (error) {
    console.log(`    ⚠️  Error fetching Prime Video calendar: ${error.message}`);
    return [];
  }
}

async function fetchLEquipeCalendar(geminiApiKey) {
  console.log('  📺 Fetching La Chaîne L\'Équipe calendar...');
  
  if (!geminiApiKey) {
    console.log('    ⚠️  No Gemini API key, using default rules');
    return { euroleague: [], betclicElite: [] };
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Récupérer la grille TV L'Équipe
    const response = await axios.get(LEQUIPE_TV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const prompt = `Tu es un expert en extraction de données TV. Analyse la grille de programmation de La Chaîne L'Équipe et extrait UNIQUEMENT les matchs de basketball.

PAGE HTML :
${response.data.substring(0, 50000)}

INSTRUCTIONS :
1. Cherche les matchs Euroleague et Betclic Elite programmés
2. Format JSON strict :
{
  "euroleague": [
    {
      "date": "2024-10-20",
      "homeTeam": "Paris Basketball",
      "awayTeam": "Real Madrid"
    }
  ],
  "betclicElite": [
    {
      "date": "2024-10-22",
      "homeTeam": "ASVEL",
      "awayTeam": "Monaco"
    }
  ]
}

3. Si AUCUN match trouvé → {"euroleague": [], "betclicElite": []}
4. N'invente RIEN - extraction uniquement

RÉPONDS UNIQUEMENT avec le JSON.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('    ℹ️  No L\'Équipe matches found in page');
      return { euroleague: [], betclicElite: [] };
    }

    const calendar = JSON.parse(jsonMatch[0]);
    console.log(`    ✅ Found ${calendar.euroleague?.length || 0} Euroleague + ${calendar.betclicElite?.length || 0} Betclic Elite matches`);
    return calendar;

  } catch (error) {
    console.log(`    ⚠️  Error fetching L'Équipe calendar: ${error.message}`);
    return { euroleague: [], betclicElite: [] };
  }
}

async function enrichWithRealBroadcasters(geminiApiKey) {
  console.log('\n📺 Enriching with REAL broadcaster calendars...');

  try {
    // Récupérer les calendriers réels
    const primeVideoMatches = await fetchPrimeVideoNBACalendar(geminiApiKey);
    const lequipeCalendar = await fetchLEquipeCalendar(geminiApiKey);

    // Récupérer tous les matchs de la semaine
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
        awayTeam: true
      }
    });

    let enrichedCount = 0;

    // Fonction helper pour ajouter un diffuseur
    const addBroadcaster = async (matchId, broadcasterName, type = 'cable', isFree = false) => {
      let broadcaster = await prisma.broadcaster.findFirst({
        where: { name: broadcasterName }
      });
      
      if (!broadcaster) {
        broadcaster = await prisma.broadcaster.create({
          data: { name: broadcasterName, type, isFree, logo: null }
        });
      }

      const exists = await prisma.matchBroadcast.findFirst({
        where: { matchId, broadcasterId: broadcaster.id }
      });

      if (!exists) {
        await prisma.matchBroadcast.create({
          data: { matchId, broadcasterId: broadcaster.id }
        });
      }
    };

    // Enrichir chaque match
    for (const match of matches) {
      const leagueName = match.league.name;
      const matchDate = match.dateTime.toISOString().split('T')[0];
      
      // Nettoyer les anciens diffuseurs
      await prisma.matchBroadcast.deleteMany({
        where: { matchId: match.id }
      });

      if (leagueName === 'NBA') {
        // Toujours beIN Sports et NBA League Pass
        await addBroadcaster(match.id, 'beIN Sports', 'cable', false);
        await addBroadcaster(match.id, 'NBA League Pass', 'streaming', false);

        // Prime Video si trouvé dans le calendrier réel
        const isPrimeVideo = primeVideoMatches.some(pm => {
          const pmDate = new Date(pm.date).toISOString().split('T')[0];
          return pmDate === matchDate &&
                 (match.homeTeam.name.includes(pm.homeTeam) || match.awayTeam.name.includes(pm.awayTeam));
        });

        if (isPrimeVideo) {
          await addBroadcaster(match.id, 'Prime Video', 'streaming', false);
        }

        enrichedCount++;

      } else if (leagueName === 'Euroleague') {
        // Toujours SKWEEK et EuroLeague TV
        await addBroadcaster(match.id, 'SKWEEK', 'streaming', false);
        await addBroadcaster(match.id, 'EuroLeague TV', 'streaming', false);

        // La Chaîne L'Équipe si trouvé dans le calendrier réel
        const isLEquipe = lequipeCalendar.euroleague?.some(lm => {
          const lmDate = new Date(lm.date).toISOString().split('T')[0];
          return lmDate === matchDate &&
                 (match.homeTeam.name.includes(lm.homeTeam) || match.awayTeam.name.includes(lm.awayTeam));
        });

        if (isLEquipe) {
          await addBroadcaster(match.id, 'La Chaîne L\'Équipe', 'cable', true);
        }

        // TV Monaco pour AS Monaco à domicile
        if (match.homeTeam.name.includes('MONACO')) {
          await addBroadcaster(match.id, 'TV Monaco', 'cable', true);
        }

        enrichedCount++;

      } else if (leagueName === 'Betclic Elite') {
        // Toujours beIN Sports et SKWEEK
        await addBroadcaster(match.id, 'beIN Sports', 'cable', false);
        await addBroadcaster(match.id, 'SKWEEK', 'streaming', false);

        // La Chaîne L'Équipe si trouvé dans le calendrier réel
        const isLEquipe = lequipeCalendar.betclicElite?.some(lm => {
          const lmDate = new Date(lm.date).toISOString().split('T')[0];
          return lmDate === matchDate &&
                 (match.homeTeam.name.includes(lm.homeTeam) || match.awayTeam.name.includes(lm.awayTeam));
        });

        if (isLEquipe) {
          await addBroadcaster(match.id, 'La Chaîne L\'Équipe', 'cable', true);
        }

        enrichedCount++;
      }
    }

    console.log(`  ✅ Enriched ${enrichedCount} matches with real broadcaster calendars`);
    return enrichedCount;

  } catch (error) {
    console.error('  ❌ Error enriching with broadcaster calendars:', error.message);
    return 0;
  }
}

module.exports = {
  enrichWithRealBroadcasters,
  fetchPrimeVideoNBACalendar,
  fetchLEquipeCalendar
};
