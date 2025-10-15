// Gemini AI integration for enriching matches with French TV broadcasters
// Reference: blueprint:javascript_gemini
const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BROADCASTER_MAPPING = {
  NBA: [
    { name: 'beIN Sports', isFree: false },
    { name: 'Prime Video', isFree: false },
    { name: 'NBA League Pass', isFree: false }
  ],
  WNBA: [
    { name: 'NBA League Pass', isFree: false },
    { name: 'beIN Sports', isFree: false }
  ],
  Euroleague: [
    { name: 'SKWEEK', isFree: false },
    { name: "La Chaîne L'Équipe", isFree: true },
    { name: 'TV Monaco', isFree: true },
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
 * Enrich matches with French TV broadcasters using Gemini
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<number>} Number of matches enriched
 */
async function enrichBroadcasters(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  No Gemini API key configured for broadcaster enrichment');
    return 0;
  }

  try {
    console.log('  🔍 Enriching matches with French broadcasters via Gemini...');
    
    // Get matches from the next 14 days without broadcasters
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: today,
          lte: twoWeeksLater
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
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    if (matches.length === 0) {
      console.log('  ℹ️  No matches found to enrich');
      return 0;
    }

    console.log(`  📊 Found ${matches.length} matches to check for broadcasters`);

    const ai = new GoogleGenAI({ apiKey });
    let enrichedCount = 0;

    // Process matches in batches of 10 to avoid overwhelming Gemini
    const batchSize = 10;
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      try {
        const enriched = await enrichBatch(ai, batch);
        enrichedCount += enriched;
      } catch (error) {
        console.error(`  ⚠️  Error enriching batch ${i / batchSize + 1}:`, error.message);
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < matches.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`  ✅ Enriched ${enrichedCount} matches with broadcasters`);
    return enrichedCount;
  } catch (error) {
    console.error('  ❌ Gemini enrichment error:', error.message);
    return 0;
  }
}

/**
 * Enrich a batch of matches with broadcasters
 */
async function enrichBatch(ai, matches) {
  // Build prompt with match details
  const matchList = matches.map((m, idx) => 
    `${idx + 1}. ${m.homeTeam.name} vs ${m.awayTeam.name} - ${m.league.name} - ${formatDate(m.dateTime)}`
  ).join('\n');

  const prompt = `Pour les matchs de basketball suivants diffusés en France, indique UNIQUEMENT les chaînes TV françaises qui diffusent chaque match:

${matchList}

Réponds UNIQUEMENT avec un JSON array. Pour chaque match, fournis les diffuseurs français avec leurs logos (PNG ou JPG direct uniquement):
[
  {
    "matchIndex": 1,
    "broadcasters": [
      {"name": "beIN Sports", "logo": "https://example.com/bein.png"},
      {"name": "Prime Video", "logo": "https://example.com/prime.png"}
    ]
  }
]

Si aucun diffuseur français n'est trouvé pour un match, retourne un array vide pour ce match.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              matchIndex: { type: 'number' },
              broadcasters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    logo: { type: 'string' }
                  },
                  required: ['name']
                }
              }
            },
            required: ['matchIndex', 'broadcasters']
          }
        }
      },
      contents: prompt
    });

    const enrichmentData = JSON.parse(response.text || '[]');
    let enrichedCount = 0;

    for (const item of enrichmentData) {
      const matchIndex = item.matchIndex - 1; // Convert to 0-based index
      if (matchIndex < 0 || matchIndex >= matches.length) continue;

      const match = matches[matchIndex];
      const broadcasters = item.broadcasters || [];

      // Use Gemini broadcasters if available, otherwise fallback to mapping
      let broadcastersToSave = broadcasters.length > 0
        ? broadcasters
        : (BROADCASTER_MAPPING[match.league.name] || []).map(b => ({
            name: b.name,
            logo: null,
            isFree: b.isFree
          }));

      if (broadcastersToSave.length === 0) continue;

      // Save broadcasters for this match
      for (const broadcasterData of broadcastersToSave) {
        try {
          const broadcasterInfo = findBroadcasterInfo(match.league.name, broadcasterData.name);
          
          // Get or create broadcaster
          let broadcaster = await prisma.broadcaster.findUnique({
            where: { name: broadcasterData.name }
          });

          if (!broadcaster) {
            broadcaster = await prisma.broadcaster.create({
              data: {
                name: broadcasterData.name,
                type: 'TV',
                logo: broadcasterData.logo || null,
                isFree: broadcasterInfo?.isFree || broadcasterData.isFree || false
              }
            });
          } else if (broadcasterData.logo && !broadcaster.logo) {
            // Update logo if we have one and broadcaster doesn't
            broadcaster = await prisma.broadcaster.update({
              where: { id: broadcaster.id },
              data: { logo: broadcasterData.logo }
            });
          }

          // Create broadcast link if not exists
          const existingBroadcast = await prisma.matchBroadcast.findUnique({
            where: {
              matchId_broadcasterId: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            }
          });

          if (!existingBroadcast) {
            await prisma.matchBroadcast.create({
              data: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            });
          }
        } catch (error) {
          console.error(`  ⚠️  Error saving broadcaster ${broadcasterData.name}:`, error.message);
        }
      }

      enrichedCount++;
    }

    return enrichedCount;
  } catch (error) {
    console.error(`  ⚠️  Error in enrichBatch:`, error.message);
    return 0;
  }
}

/**
 * Helper functions
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

function findBroadcasterInfo(leagueName, broadcasterName) {
  const mappings = BROADCASTER_MAPPING[leagueName] || [];
  return mappings.find(b => b.name === broadcasterName);
}

module.exports = { enrichBroadcasters };
