// Gemini AI integration for basketball match data with Google Search grounding
// Reference: blueprint:javascript_gemini
const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BROADCASTER_MAPPING = {
  NBA: [
    { name: 'beIN Sports', isFree: false, description: '400+ matchs par saison' },
    { name: 'Prime Video', isFree: false, description: '29 matchs du dimanche soir' },
    { name: 'NBA League Pass', isFree: false, description: 'Tous les matchs' }
  ],
  WNBA: [
    { name: 'NBA League Pass', isFree: false },
    { name: 'beIN Sports', isFree: false }
  ],
  Euroleague: [
    { name: 'SKWEEK', isFree: false, description: 'Tous les matchs' },
    { name: "La Chaîne L'Équipe", isFree: true, description: 'Matchs sélectionnés (Paris Basketball, ASVEL)' },
    { name: 'TV Monaco', isFree: true, description: 'Tous les matchs de l\'AS Monaco' },
    { name: 'EuroLeague TV', isFree: false }
  ],
  'Betclic Elite': [
    { name: 'beIN Sports', isFree: false },
    { name: "La Chaîne L'Équipe", isFree: true },
    { name: 'DAZN', isFree: false }
  ],
  EuroCup: [
    { name: 'SKWEEK', isFree: false },
    { name: 'EuroLeague TV', isFree: false }
  ],
  BCL: [
    { name: 'Courtside 1891', isFree: false }
  ]
};

/**
 * Fetch basketball matches using Gemini with Google Search grounding
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<number>} Number of matches saved
 */
async function fetchAndSave(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  No Gemini API key configured');
    return 0;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Date range for next 2 weeks
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = nextWeek.toISOString().split('T')[0];

    const prompt = `Recherche les matchs de basketball suivants entre ${startDate} et ${endDate} :
    
1. NBA (matches diffusés en France)
2. WNBA (matches diffusés en France)
3. Euroleague Basketball
4. EuroCup Basketball
5. Betclic Elite (championnat français)
6. Basketball Champions League (BCL)

Pour chaque match, fournis:
- Date et heure exactes (format ISO 8601 avec timezone Europe/Paris)
- Équipe domicile (nom complet)
- Équipe extérieure (nom complet)
- Ligue/compétition
- Chaînes TV françaises qui diffusent le match (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, TV Monaco, DAZN, NBA League Pass, EuroLeague TV, Courtside 1891)

Réponds UNIQUEMENT avec un JSON array valide contenant les matchs trouvés. Format:
[
  {
    "date": "2025-10-16T20:00:00+02:00",
    "homeTeam": "Paris Basketball",
    "awayTeam": "Real Madrid",
    "league": "Euroleague",
    "broadcasters": ["SKWEEK", "La Chaîne L'Équipe"]
  }
]`;

    console.log('  🔍 Searching with Gemini + Google Search...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              homeTeam: { type: 'string' },
              awayTeam: { type: 'string' },
              league: { type: 'string' },
              broadcasters: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['date', 'homeTeam', 'awayTeam', 'league']
          }
        }
      },
      contents: prompt
    });

    const matchesData = JSON.parse(response.text || '[]');
    console.log(`  📊 Gemini found ${matchesData.length} potential matches`);

    if (!matchesData || matchesData.length === 0) {
      return 0;
    }

    let savedCount = 0;

    for (const matchData of matchesData) {
      try {
        const matchDate = new Date(matchData.date);
        if (isNaN(matchDate.getTime())) {
          console.log(`  ⚠️  Invalid date: ${matchData.date}`);
          continue;
        }

        // Normalize league name
        const leagueName = normalizeLeagueName(matchData.league);
        if (!leagueName) {
          console.log(`  ⚠️  Unknown league: ${matchData.league}`);
          continue;
        }

        // Get or create league
        const league = await prisma.league.upsert({
          where: { name: leagueName },
          update: {},
          create: {
            name: leagueName,
            shortName: getShortName(leagueName),
            country: getCountry(leagueName),
            color: getLeagueColor(leagueName)
          }
        });

        // Get or create teams (Team.name is not unique, so use findFirst + create)
        let homeTeam = await prisma.team.findFirst({
          where: { name: matchData.homeTeam }
        });
        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: { name: matchData.homeTeam }
          });
        }

        let awayTeam = await prisma.team.findFirst({
          where: { name: matchData.awayTeam }
        });
        if (!awayTeam) {
          awayTeam = await prisma.team.create({
            data: { name: matchData.awayTeam }
          });
        }

        // Create unique external ID with gemini prefix
        const externalId = `gemini-${leagueName}-${matchDate.getTime()}-${homeTeam.id}-${awayTeam.id}`;

        // Check if match already exists
        const existingMatch = await prisma.match.findUnique({
          where: { externalId }
        });

        if (existingMatch) {
          console.log(`  ⏭️  Match already exists: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
          continue;
        }

        // Create match
        const match = await prisma.match.create({
          data: {
            externalId,
            date: matchDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: 'scheduled'
          }
        });

        // Add broadcasters
        const broadcasterNames = matchData.broadcasters || BROADCASTER_MAPPING[leagueName]?.map(b => b.name) || [];
        
        for (const broadcasterName of broadcasterNames) {
          const broadcasterInfo = findBroadcasterInfo(leagueName, broadcasterName);
          
          const broadcaster = await prisma.broadcaster.upsert({
            where: { name: broadcasterName },
            update: {},
            create: {
              name: broadcasterName,
              isFree: broadcasterInfo?.isFree || false,
              description: broadcasterInfo?.description || null
            }
          });

          await prisma.broadcast.create({
            data: {
              matchId: match.id,
              broadcasterId: broadcaster.id
            }
          });
        }

        savedCount++;
        console.log(`  ✅ Saved: ${matchData.homeTeam} vs ${matchData.awayTeam} (${leagueName})`);

      } catch (error) {
        console.error(`  ❌ Error saving match:`, error.message);
      }
    }

    console.log(`  ✅ Gemini source: ${savedCount} new matches saved`);
    return savedCount;

  } catch (error) {
    console.error('  ❌ Gemini API error:', error.message);
    return 0;
  }
}

function normalizeLeagueName(league) {
  const normalized = league.toLowerCase().trim();
  
  if (normalized.includes('nba') && !normalized.includes('wnba')) return 'NBA';
  if (normalized.includes('wnba')) return 'WNBA';
  if (normalized.includes('euroleague') && !normalized.includes('eurocup')) return 'Euroleague';
  if (normalized.includes('eurocup')) return 'EuroCup';
  if (normalized.includes('betclic') || normalized.includes('lnb') || normalized.includes('pro a')) return 'Betclic Elite';
  if (normalized.includes('bcl') || normalized.includes('champions league')) return 'BCL';
  
  return null;
}

function getShortName(leagueName) {
  const mapping = {
    'NBA': 'NBA',
    'WNBA': 'WNBA',
    'Euroleague': 'EL',
    'EuroCup': 'EC',
    'Betclic Elite': 'LNB',
    'BCL': 'BCL'
  };
  return mapping[leagueName] || leagueName.substring(0, 3).toUpperCase();
}

function getCountry(leagueName) {
  if (leagueName === 'NBA' || leagueName === 'WNBA') return 'USA';
  if (leagueName === 'Betclic Elite') return 'France';
  return 'Europe';
}

function getLeagueColor(leagueName) {
  const colors = {
    'NBA': '#1D428A',
    'WNBA': '#FF6B35',
    'Euroleague': '#E4002B',
    'EuroCup': '#FDB913',
    'Betclic Elite': '#00A650',
    'BCL': '#1E3A8A'
  };
  return colors[leagueName] || '#6B7280';
}

function findBroadcasterInfo(leagueName, broadcasterName) {
  const broadcasters = BROADCASTER_MAPPING[leagueName] || [];
  return broadcasters.find(b => b.name.toLowerCase() === broadcasterName.toLowerCase());
}

module.exports = {
  fetchAndSave
};
