const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BROADCASTER_MAPPING = {
  NBA: ['beIN Sports', 'Prime Video', 'NBA League Pass'],
  WNBA: ['NBA League Pass', 'beIN Sports'],
  Euroleague: [],  // Will be determined by Gemini only
  'Betclic Elite': ['beIN Sports', 'La Chaîne L\'Équipe', 'DAZN']
};

async function enrichMatchesWithBroadcasters(geminiApiKey) {
  console.log('\n🤖 Enriching matches with Gemini AI broadcasters...');
  
  if (!geminiApiKey) {
    console.log('  ⚠️  No Gemini API key configured, skipping broadcaster enrichment');
    return 0;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Get matches without broadcasters from the last 30 days
    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
      take: 50
    });

    if (matches.length === 0) {
      console.log('  ℹ️  No matches to enrich');
      return 0;
    }

    console.log(`  📋 Found ${matches.length} matches to process`);

    let enrichedCount = 0;

    // Process matches by league
    const matchesByLeague = matches.reduce((acc, match) => {
      const leagueName = match.league.name;
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(match);
      return acc;
    }, {});

    for (const [leagueName, leagueMatches] of Object.entries(matchesByLeague)) {
      const knownBroadcasters = BROADCASTER_MAPPING[leagueName] || [];
      
      // Take first 10 matches for this league
      const sampleMatches = leagueMatches.slice(0, 10);
      
      const prompt = `Tu es un expert en diffusion de basketball en France.

Voici ${sampleMatches.length} matchs de ${leagueName} :
${sampleMatches.map((m, i) => `${i+1}. ${m.homeTeam.name} vs ${m.awayTeam.name} (${new Date(m.dateTime).toLocaleDateString('fr-FR')})`).join('\n')}

Diffuseurs français connus pour ${leagueName} : ${knownBroadcasters.join(', ')}

Pour CHAQUE match, indique UNIQUEMENT les diffuseurs français qui vont réellement diffuser ce match.
Réponds UNIQUEMENT avec un JSON array, un objet par match avec cette structure exacte :
[
  {
    "matchIndex": 1,
    "broadcasters": ["beIN Sports", "NBA League Pass"]
  }
]

RÈGLES STRICTES :
- Si tu n'es pas sûr, utilise les diffuseurs par défaut de la ligue
- JAMAIS de diffuseurs inventés
- UNIQUEMENT des chaînes françaises (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN, NBA League Pass, EuroLeague TV)`;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.log(`  ⚠️  No valid JSON for ${leagueName}, using defaults`);
          await applyDefaultBroadcasters(sampleMatches, knownBroadcasters);
          enrichedCount += sampleMatches.length;
          continue;
        }

        const broadcastData = JSON.parse(jsonMatch[0]);
        
        for (const data of broadcastData) {
          const match = sampleMatches[data.matchIndex - 1];
          if (!match) continue;

          const broadcasters = data.broadcasters || knownBroadcasters;
          
          // Clear existing broadcasts
          await prisma.matchBroadcast.deleteMany({
            where: { matchId: match.id }
          });

          // Add new broadcasts
          for (const broadcasterName of broadcasters) {
            const broadcaster = await prisma.broadcaster.findFirst({
              where: { name: broadcasterName }
            });

            if (broadcaster) {
              await prisma.matchBroadcast.create({
                data: {
                  matchId: match.id,
                  broadcasterId: broadcaster.id
                }
              });
            }
          }
          
          enrichedCount++;
        }

        console.log(`  ✅ ${leagueName}: ${broadcastData.length} matches enriched`);
        
      } catch (error) {
        console.log(`  ⚠️  Error enriching ${leagueName}:`, error.message);
        await applyDefaultBroadcasters(sampleMatches, knownBroadcasters);
        enrichedCount += sampleMatches.length;
      }

      // Small delay between leagues
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`  ✅ Gemini enrichment: ${enrichedCount} matches updated with broadcasters`);
    return enrichedCount;

  } catch (error) {
    console.error('  ❌ Gemini enrichment error:', error.message);
    return 0;
  }
}

async function applyDefaultBroadcasters(matches, broadcasterNames) {
  for (const match of matches) {
    await prisma.matchBroadcast.deleteMany({
      where: { matchId: match.id }
    });

    for (const broadcasterName of broadcasterNames) {
      const broadcaster = await prisma.broadcaster.findFirst({
        where: { name: broadcasterName }
      });

      if (broadcaster) {
        await prisma.matchBroadcast.create({
          data: {
            matchId: match.id,
            broadcasterId: broadcaster.id
          }
        });
      }
    }
  }
}

module.exports = {
  enrichMatchesWithBroadcasters
};
