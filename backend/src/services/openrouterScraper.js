const OpenAI = require('openai');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCES_TO_SCRAPE = [
  {
    name: 'Prime Video Sport',
    url: 'https://www.primevideo.com/region/eu/sport',
    type: 'streaming',
    focus: 'NBA, Basketball'
  },
  {
    name: 'beIN Sports',
    url: 'https://www.beinsports.com/fr/basketball',
    type: 'tv',
    focus: 'NBA, Euroleague, Basketball'
  },
  {
    name: 'La Chaîne L\'Équipe',
    url: 'https://www.lequipe.fr/Basketball',
    type: 'tv',
    focus: 'Euroleague, Basketball français'
  },
  {
    name: 'DAZN France',
    url: 'https://www.dazn.com/fr-FR/sports/Basketball',
    type: 'streaming',
    focus: 'Basketball'
  },
  {
    name: 'Skweek',
    url: 'https://www.skweek.com/',
    type: 'streaming',
    focus: 'Euroleague, Basketball'
  }
];

const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction d'informations de matchs de basketball.

Analyse le texte suivant et extrais UNIQUEMENT les matchs de basketball diffusés en France.

Pour chaque match trouvé, retourne un objet JSON avec:
{
  "league": "NBA" | "WNBA" | "Euroleague" | "Betclic Elite" | "EuroCup" | "BCL",
  "homeTeam": "Nom de l'équipe à domicile",
  "awayTeam": "Nom de l'équipe à l'extérieur",
  "dateTime": "Date et heure au format ISO 8601",
  "broadcaster": "Nom du diffuseur",
  "venue": "Lieu du match (si disponible)"
}

RÈGLES IMPORTANTES:
- Retourne UNIQUEMENT un tableau JSON valide
- Si aucun match n'est trouvé, retourne un tableau vide []
- N'ajoute AUCUN texte avant ou après le JSON
- Extrais UNIQUEMENT les matchs avec date et heure précises
- Ignore les matchs passés (plus anciens que aujourd'hui)
- Ne pas inventer de données

Texte à analyser:
`;

async function getOpenRouterClient() {
  const apiKeyConfig = await prisma.config.findUnique({
    where: { key: 'OPENROUTER_API_KEY' }
  });

  const modelConfig = await prisma.config.findUnique({
    where: { key: 'OPENROUTER_MODEL' }
  });

  if (!apiKeyConfig || !apiKeyConfig.value) {
    throw new Error('OpenRouter API key not configured');
  }

  if (!modelConfig || !modelConfig.value) {
    throw new Error('OpenRouter model not configured');
  }

  return {
    client: new OpenAI({
      apiKey: apiKeyConfig.value,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    model: modelConfig.value
  };
}

async function fetchSourceContent(source) {
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    const html = response.data;
    
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (textContent.length < 100) {
      throw new Error('Content too short, likely blocked or empty page');
    }

    return textContent.substring(0, 8000);

  } catch (error) {
    console.error(`  ❌ Failed to fetch ${source.name}:`, error.message);
    return null;
  }
}

async function scrapeSource(source) {
  console.log(`  📡 Scraping ${source.name}...`);
  
  const content = await fetchSourceContent(source);
  
  if (!content) {
    console.log(`  ⚠️  Skipping ${source.name} - could not fetch content`);
    return [];
  }

  try {
    const { client, model } = await getOpenRouterClient();

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { 
          role: 'user', 
          content: EXTRACTION_PROMPT + '\n\n' + content 
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content.trim();
    
    let matches = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]);
      } else {
        matches = JSON.parse(response);
      }
    } catch (parseError) {
      console.error(`  ❌ Failed to parse JSON from ${source.name}:`, parseError);
      return [];
    }

    console.log(`  ✅ Found ${matches.length} matches from ${source.name}`);
    return matches.map(m => ({ ...m, source: source.name }));

  } catch (error) {
    console.error(`  ❌ Error scraping ${source.name}:`, error.message);
    return [];
  }
}

async function scrapeAllSources() {
  console.log('🤖 Starting AI-powered scraping...');
  
  const allMatches = [];
  let successfulSources = 0;
  
  for (const source of SOURCES_TO_SCRAPE) {
    const matches = await scrapeSource(source);
    if (matches.length > 0) {
      successfulSources++;
    }
    allMatches.push(...matches);
  }

  console.log(`📊 Total matches extracted: ${allMatches.length} from ${successfulSources}/${SOURCES_TO_SCRAPE.length} sources`);
  
  return {
    matches: allMatches,
    successfulSources,
    totalSources: SOURCES_TO_SCRAPE.length
  };
}

async function saveMatchesToDatabase(matches) {
  console.log('💾 Saving matches to database...');
  
  const BROADCASTER_MAPPING = {
    'Prime Video': { isFree: false },
    'beIN Sports': { isFree: false },
    "La Chaîne L'Équipe": { isFree: true },
    'DAZN': { isFree: false },
    'Skweek': { isFree: false },
    'NBA League Pass': { isFree: false },
    'EuroLeague TV': { isFree: false },
    'TV Monaco': { isFree: true }
  };

  let savedCount = 0;

  for (const match of matches) {
    try {
      const league = await prisma.league.upsert({
        where: { name: match.league },
        update: {},
        create: {
          name: match.league,
          shortName: match.league.substring(0, 3).toUpperCase(),
          country: match.league.includes('NBA') ? 'USA' : 'Europe',
          color: getLeagueColor(match.league)
        }
      });

      const homeTeam = await prisma.team.upsert({
        where: { id: `${match.homeTeam}-${league.id}` },
        update: { name: match.homeTeam },
        create: {
          id: `${match.homeTeam}-${league.id}`,
          name: match.homeTeam,
          shortName: match.homeTeam.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const awayTeam = await prisma.team.upsert({
        where: { id: `${match.awayTeam}-${league.id}` },
        update: { name: match.awayTeam },
        create: {
          id: `${match.awayTeam}-${league.id}`,
          name: match.awayTeam,
          shortName: match.awayTeam.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const externalId = `scrape-${match.league}-${match.homeTeam}-${match.awayTeam}-${match.dateTime}`;

      const savedMatch = await prisma.match.upsert({
        where: { externalId },
        update: {
          dateTime: new Date(match.dateTime),
          venue: match.venue || null
        },
        create: {
          externalId,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          dateTime: new Date(match.dateTime),
          venue: match.venue || null,
          status: 'scheduled'
        }
      });

      const broadcasterInfo = BROADCASTER_MAPPING[match.broadcaster] || { isFree: false };
      const broadcaster = await prisma.broadcaster.upsert({
        where: { name: match.broadcaster },
        update: {},
        create: {
          name: match.broadcaster,
          type: 'TV',
          isFree: broadcasterInfo.isFree
        }
      });

      await prisma.matchBroadcast.upsert({
        where: {
          matchId_broadcasterId: {
            matchId: savedMatch.id,
            broadcasterId: broadcaster.id
          }
        },
        update: {},
        create: {
          matchId: savedMatch.id,
          broadcasterId: broadcaster.id
        }
      });

      savedCount++;
    } catch (error) {
      console.error(`  ❌ Error saving match:`, error.message);
    }
  }

  console.log(`✅ Saved ${savedCount} matches to database`);
}

function getLeagueColor(leagueName) {
  const colors = {
    'NBA': '#1D428A',
    'WNBA': '#C8102E',
    'Euroleague': '#FF7900',
    'EuroCup': '#009CDE',
    'BCL': '#000000',
    'Betclic Elite': '#002654'
  };
  return colors[leagueName] || '#000000';
}

module.exports = {
  scrapeAllSources,
  saveMatchesToDatabase,
  getOpenRouterClient
};
