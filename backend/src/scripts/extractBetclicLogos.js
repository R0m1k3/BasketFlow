const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4423-french-lnb';

async function extractBetclicLogos() {
  console.log('🏀 Extracting Betclic Elite team logos from TheSportsDB...\n');
  
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

    const prompt = `Tu es un expert en extraction de données HTML pour le basketball français.

Voici le code HTML de la page TheSportsDB pour la ligue Betclic Elite (LNB Pro A) :

${html}

TÂCHE : Extraire UNIQUEMENT les équipes Betclic Elite avec leurs logos depuis cette page.

INSTRUCTIONS CRITIQUES :
- Trouve toutes les équipes de la ligue Betclic Elite affichées sur la page
- Pour chaque équipe, extrais : nom complet de l'équipe ET l'URL de son logo/badge
- Les logos sont généralement dans des balises <img> avec des URLs contenant "thesportsdb.com/images"
- N'INVENTE AUCUNE donnée, extrais SEULEMENT ce qui est présent dans le HTML

Réponds UNIQUEMENT avec un JSON array valide, sans texte avant ou après :
[
  {
    "teamName": "nom complet de l'équipe",
    "logoUrl": "URL complète du logo (https://...)"
  }
]

Si une équipe n'a pas de logo visible, utilise logoUrl: null`;

    console.log('🤖 Asking Gemini to extract team logos...\n');
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No valid JSON found in Gemini response');
      console.log('Response:', responseText);
      process.exit(1);
    }

    const teams = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Extracted ${teams.length} teams with logos:\n`);
    
    teams.forEach(team => {
      console.log(`  ${team.teamName}:`);
      console.log(`    ${team.logoUrl || 'No logo'}\n`);
    });

    console.log('\n📋 Copy this to logoMapping.js:\n');
    teams.forEach(team => {
      const logoValue = team.logoUrl ? `'${team.logoUrl}'` : 'null';
      console.log(`  '${team.teamName}': ${logoValue},`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

extractBetclicLogos();
