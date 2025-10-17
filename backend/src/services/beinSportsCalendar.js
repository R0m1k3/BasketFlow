const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// URL du calendrier beIN Sports
const BEIN_SPORTS_NBA_URL = 'https://www.beinsports.com/fr/nba/calendrier-resultats';

async function fetchBeinSportsNBACalendar(geminiApiKey) {
  console.log('  📺 Fetching beIN Sports NBA calendar...');
  
  if (!geminiApiKey) {
    console.log('    ⚠️  No Gemini API key - cannot extract beIN calendar');
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Récupérer la page beIN Sports
    const response = await axios.get(BEIN_SPORTS_NBA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const prompt = `Tu es un expert en extraction de données sportives. Analyse cette page beIN Sports et extrait UNIQUEMENT les matchs NBA programmés à venir.

PAGE HTML beIN Sports (${response.data.length} caractères) :
${response.data.substring(0, 80000)}

INSTRUCTIONS STRICTES :
1. Cherche les matchs NBA avec dates précises et équipes
2. Format JSON strict - tableau d'objets :
[
  {
    "date": "2024-10-20",
    "homeTeam": "Lakers",
    "awayTeam": "Warriors",
    "time": "02:30"
  }
]

3. RÈGLES CRITIQUES :
   - Si AUCUN match trouvé → renvoie []
   - N'invente JAMAIS de données
   - Extraction pure - zéro hallucination
   - Utilise les noms courts des équipes (Lakers, Warriors, Celtics, etc.)
   
4. Cherche les sections : "À venir", "Prochains matchs", "Calendrier", etc.

RÉPONDS UNIQUEMENT avec le JSON array - rien d'autre.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log('    ℹ️  No beIN Sports NBA matches found in calendar');
      return [];
    }

    const matches = JSON.parse(jsonMatch[0]);
    console.log(`    ✅ Found ${matches.length} NBA matches on beIN Sports calendar`);
    
    // Afficher les premiers matchs pour debug
    if (matches.length > 0) {
      matches.slice(0, 3).forEach(m => {
        console.log(`       ${m.date} ${m.time || ''} - ${m.homeTeam} vs ${m.awayTeam}`);
      });
    }
    
    return matches;

  } catch (error) {
    console.log(`    ⚠️  Error fetching beIN Sports calendar: ${error.message}`);
    return [];
  }
}

module.exports = {
  fetchBeinSportsNBACalendar
};
