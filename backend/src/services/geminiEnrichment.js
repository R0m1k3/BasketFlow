const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
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
  console.log('\n🤖 Enriching matches with Gemini AI broadcasters...');
  
  if (!geminiApiKey) {
    console.log('  ⚠️  No Gemini API key configured, skipping broadcaster enrichment');
    return 0;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

    const matchesByLeague = matches.reduce((acc, match) => {
      const leagueName = match.league.name;
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(match);
      return acc;
    }, {});

    for (const [leagueName, leagueMatches] of Object.entries(matchesByLeague)) {
      const sampleMatches = leagueMatches.slice(0, 10);
      const knowledgeBase = BROADCASTER_KNOWLEDGE_BASE[leagueName] || '';
      
      const prompt = `Tu es un expert en droits de diffusion du basketball en France. Tu connais PARFAITEMENT les accords officiels 2024-2025.

CONNAISSANCES OFFICIELLES ${leagueName} :
${knowledgeBase}

MATCHS À ANALYSER (${sampleMatches.length}) :
${sampleMatches.map((m, i) => `${i+1}. ${m.homeTeam.name} vs ${m.awayTeam.name} le ${new Date(m.dateTime).toLocaleDateString('fr-FR')} à ${new Date(m.dateTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`).join('\n')}

INSTRUCTIONS CRITIQUES :
1. Pour CHAQUE match, détermine les diffuseurs français RÉELS basés sur tes connaissances des accords officiels
2. **SI TU NE SAIS PAS avec certitude** quel diffuseur diffuse un match spécifique → renvoie null pour ce match
3. N'INVENTE JAMAIS de diffuseurs - mieux vaut null que faux
4. Utilise UNIQUEMENT ces diffuseurs français : beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN, NBA League Pass, EuroLeague TV, TV Monaco

EXEMPLES DE RAISONNEMENT :
- NBA un mardi soir → probablement beIN Sports (2 matchs/nuit) mais SI TU N'ES PAS SÛR → null
- NBA un dimanche avec équipe populaire → beIN Sports + possiblement Prime Video
- EuroLeague avec Paris Basketball → SKWEEK (certain) + La Chaîne L'Équipe (vérifier la date dans le calendrier)
- EuroLeague avec AS Monaco → SKWEEK (certain) + TV Monaco (certain)
- Betclic Elite → null si incertain (beIN/L'Équipe/DAZN selon match mais pas de calendrier précis)

RÉPONDS UNIQUEMENT avec ce JSON array exact :
[
  {
    "matchIndex": 1,
    "broadcasters": ["beIN Sports", "SKWEEK"]
  },
  {
    "matchIndex": 2,
    "broadcasters": null
  }
]

RAPPEL FINAL : Précision > Complétude. Si tu doutes → null.`;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.log(`  ⚠️  No valid JSON for ${leagueName}, skipping`);
          continue;
        }

        const broadcastData = JSON.parse(jsonMatch[0]);
        
        for (const data of broadcastData) {
          const match = sampleMatches[data.matchIndex - 1];
          if (!match) continue;

          const broadcasters = data.broadcasters;
          
          if (broadcasters === null || broadcasters.length === 0) {
            console.log(`    ℹ️  Match ${data.matchIndex}: Gemini ne sait pas → conservé tel quel`);
            continue;
          }

          await prisma.matchBroadcast.deleteMany({
            where: { matchId: match.id }
          });

          for (const broadcasterName of broadcasters) {
            let broadcaster = await prisma.broadcaster.findFirst({
              where: { name: broadcasterName }
            });

            if (!broadcaster) {
              const isFree = ['La Chaîne L\'Équipe', 'TV Monaco'].includes(broadcasterName);
              const type = ['NBA League Pass', 'EuroLeague TV', 'SKWEEK', 'DAZN'].includes(broadcasterName) ? 'streaming' : 'cable';
              
              broadcaster = await prisma.broadcaster.create({
                data: {
                  name: broadcasterName,
                  type: type,
                  isFree: isFree,
                  logo: null
                }
              });
            }

            await prisma.matchBroadcast.create({
              data: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            });
          }
          
          enrichedCount++;
        }

        console.log(`  ✅ ${leagueName}: ${enrichedCount} matches enriched with real broadcasters`);
        
      } catch (error) {
        console.log(`  ⚠️  Error enriching ${leagueName}:`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`  ✅ Gemini enrichment: ${enrichedCount} matches updated with broadcasters`);
    return enrichedCount;

  } catch (error) {
    console.error('  ❌ Gemini enrichment error:', error.message);
    return 0;
  }
}

module.exports = {
  enrichMatchesWithBroadcasters
};
