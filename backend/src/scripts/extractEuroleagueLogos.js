const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4546-euroleague-basketball';

async function extractEuroleagueLogos() {
  console.log('🏀 Extracting Euroleague team logos and results from TheSportsDB...\n');
  
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    const response = await axios.get(THESPORTSDB_PAGE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    console.log(`📄 Retrieved HTML page (${Math.round(html.length / 1024)}KB)\n`);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Tu es un expert en extraction de données HTML pour le basketball européen.

Voici le code HTML de la page TheSportsDB pour l'EuroLeague Basketball :

${html}

TÂCHE : Extraire DEUX types d'informations :
1. TOUS les LOGOS des équipes EuroLeague (URLs des badges/logos)
2. Les RÉSULTATS RÉCENTS avec SCORES depuis la section "Results"

FORMAT DE RÉPONSE (JSON OBLIGATOIRE) :
{
  "teams": [
    {
      "teamName": "FC Barcelona",
      "logoUrl": "https://r2.thesportsdb.com/images/media/team/badge/..."
    }
  ],
  "results": [
    {
      "homeTeam": "FC Barcelona",
      "awayTeam": "Real Madrid",
      "homeScore": 85,
      "awayScore": 78,
      "date": "2025-10-12"
    }
  ]
}

INSTRUCTIONS :
- Pour teams : extrais TOUTES les équipes EuroLeague avec leurs logos
- Pour results : extrais les matchs de la section "Results" avec les SCORES
- N'INVENTE RIEN, extrais UNIQUEMENT ce qui est présent dans le HTML
- Si une équipe n'a pas de logo → logoUrl: null
- Si aucun résultat → results: []

Réponds UNIQUEMENT avec le JSON ci-dessus, sans texte avant ou après.`;

    console.log('🤖 Asking Gemini to extract team logos and results...\n');
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    jsonText = jsonText.trim();

    const data = JSON.parse(jsonText);
    
    console.log(`✅ Extracted ${data.teams?.length || 0} teams and ${data.results?.length || 0} results\n`);
    
    if (data.teams && data.teams.length > 0) {
      console.log('📋 TEAM LOGOS - Copy to logoMapping.js:\n');
      data.teams.forEach(team => {
        const logoValue = team.logoUrl ? `'${team.logoUrl}'` : 'null';
        console.log(`  '${team.teamName}': ${logoValue},`);
      });
    }

    if (data.results && data.results.length > 0) {
      console.log('\n🏀 RECENT RESULTS WITH SCORES:\n');
      data.results.forEach(r => {
        console.log(`  ${r.homeTeam} ${r.homeScore} - ${r.awayScore} ${r.awayTeam} (${r.date})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

extractEuroleagueLogos();
