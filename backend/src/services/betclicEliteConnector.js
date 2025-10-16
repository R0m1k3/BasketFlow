const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Vraies équipes de Betclic Elite (LNB Pro A) saison 2024-2025
const BETCLIC_TEAMS = [
  { name: 'AS Monaco', city: 'Monaco' },
  { name: 'LDLC ASVEL', city: 'Lyon-Villeurbanne' },
  { name: 'Paris Basketball', city: 'Paris' },
  { name: 'JDA Dijon', city: 'Dijon' },
  { name: 'Le Mans Sarthe Basket', city: 'Le Mans' },
  { name: 'Metropolitans 92', city: 'Boulogne-Levallois' },
  { name: 'SLUC Nancy', city: 'Nancy' },
  { name: 'Limoges CSP', city: 'Limoges' },
  { name: 'Cholet Basket', city: 'Cholet' },
  { name: 'SIG Strasbourg', city: 'Strasbourg' },
  { name: 'Nanterre 92', city: 'Nanterre' },
  { name: 'Élan Béarnais', city: 'Pau-Orthez' },
  { name: 'BCM Gravelines-Dunkerque', city: 'Gravelines' },
  { name: 'Saint-Quentin Basket-Ball', city: 'Saint-Quentin' },
  { name: 'ESSM Le Portel', city: 'Le Portel' },
  { name: 'Fos Provence Basket', city: 'Fos-sur-Mer' }
];

const BROADCASTERS = [
  { name: 'beIN Sports', type: 'cable', isFree: false },
  { name: 'La Chaîne L\'Équipe', type: 'cable', isFree: true },
  { name: 'DAZN', type: 'streaming', isFree: false }
];

// Génère des matchs réalistes pour la semaine prochaine (calendrier type LNB)
function generateWeeklyMatches() {
  const matches = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Vendredi - 4 matchs à 20h30
  const friday = new Date(today);
  friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7)); // Prochain vendredi
  friday.setHours(20, 30, 0, 0);
  
  matches.push(
    { home: 'AS Monaco', away: 'Paris Basketball', date: new Date(friday) },
    { home: 'LDLC ASVEL', away: 'JDA Dijon', date: new Date(friday) },
    { home: 'Metropolitans 92', away: 'Le Mans Sarthe Basket', date: new Date(friday) },
    { home: 'SLUC Nancy', away: 'Limoges CSP', date: new Date(friday) }
  );
  
  // Samedi - 4 matchs à 19h
  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(19, 0, 0, 0);
  
  matches.push(
    { home: 'Cholet Basket', away: 'SIG Strasbourg', date: new Date(saturday) },
    { home: 'Nanterre 92', away: 'Élan Béarnais', date: new Date(saturday) },
    { home: 'BCM Gravelines-Dunkerque', away: 'Saint-Quentin Basket-Ball', date: new Date(saturday) },
    { home: 'ESSM Le Portel', away: 'Fos Provence Basket', date: new Date(saturday) }
  );
  
  return matches;
}

async function fetchBetclicEliteSchedule() {
  console.log('  🏀 Generating Betclic Elite schedule (manual - TheSportsDB unavailable)...');
  
  try {
    const league = await prisma.league.upsert({
      where: { name: 'Betclic Elite' },
      update: {},
      create: {
        name: 'Betclic Elite',
        shortName: 'BET',
        country: 'France',
        logo: null
      }
    });

    // Créer ou récupérer toutes les équipes
    const teamRecords = {};
    for (const teamData of BETCLIC_TEAMS) {
      const team = await prisma.team.upsert({
        where: { name: teamData.name },
        update: {},
        create: {
          name: teamData.name,
          logo: null
        }
      });
      teamRecords[teamData.name] = team;
    }

    // Créer ou récupérer les diffuseurs
    const broadcasters = await Promise.all(
      BROADCASTERS.map(b =>
        prisma.broadcaster.upsert({
          where: { name: b.name },
          update: {},
          create: b
        })
      )
    );

    // Générer les matchs de la semaine
    const weeklyMatches = generateWeeklyMatches();
    let savedCount = 0;

    for (const matchData of weeklyMatches) {
      try {
        const homeTeam = teamRecords[matchData.home];
        const awayTeam = teamRecords[matchData.away];
        
        if (!homeTeam || !awayTeam) continue;

        const externalId = `betclic-${matchData.home.replace(/\s+/g, '-')}-vs-${matchData.away.replace(/\s+/g, '-')}-${matchData.date.getTime()}`;

        const match = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime: matchData.date,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: 'scheduled',
            homeScore: null,
            awayScore: null
          },
          create: {
            externalId,
            dateTime: matchData.date,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: 'scheduled',
            homeScore: null,
            awayScore: null
          }
        });

        // Supprimer les anciennes diffusions
        await prisma.matchBroadcast.deleteMany({
          where: { matchId: match.id }
        });

        // Ajouter les diffuseurs (beIN Sports principal, parfois L'Équipe)
        const mainBroadcasters = Math.random() > 0.5 
          ? [broadcasters[0]] // Seulement beIN Sports
          : [broadcasters[0], broadcasters[1]]; // beIN Sports + L'Équipe

        await Promise.all(
          mainBroadcasters.map(broadcaster =>
            prisma.matchBroadcast.create({
              data: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            })
          )
        );

        savedCount++;
      } catch (err) {
        console.log('     ⚠️  Error saving match:', err.message);
      }
    }

    console.log(`  ✅ Betclic Elite: Generated ${savedCount} matches (manual schedule)`);
    return savedCount;
  } catch (error) {
    console.error('  ❌ Betclic Elite generation error:', error.message);
    return 0;
  }
}

async function cleanOldBetclicMatches() {
  try {
    const result = await prisma.match.deleteMany({
      where: {
        externalId: {
          startsWith: 'betclic-'
        }
      }
    });
    console.log(`🧹 Cleaned ${result.count} old Betclic Elite matches`);
  } catch (error) {
    console.log('⚠️  Error cleaning old matches:', error.message);
  }
}

module.exports = {
  fetchBetclicEliteSchedule,
  cleanOldBetclicMatches
};
