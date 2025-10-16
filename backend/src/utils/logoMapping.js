const TEAM_LOGOS = {
  'Atlanta Hawks': 'https://upload.wikimedia.org/wikipedia/en/2/24/Atlanta_Hawks_logo.svg',
  'Hawks': 'https://upload.wikimedia.org/wikipedia/en/2/24/Atlanta_Hawks_logo.svg',
  'Boston Celtics': 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg',
  'Celtics': 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg',
  'Brooklyn Nets': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Brooklyn_Nets_newlogo.svg',
  'Nets': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Brooklyn_Nets_newlogo.svg',
  'Charlotte Hornets': 'https://upload.wikimedia.org/wikipedia/en/c/c4/Charlotte_Hornets_%282014%29.svg',
  'Hornets': 'https://upload.wikimedia.org/wikipedia/en/c/c4/Charlotte_Hornets_%282014%29.svg',
  'Chicago Bulls': 'https://upload.wikimedia.org/wikipedia/en/6/67/Chicago_Bulls_logo.svg',
  'Bulls': 'https://upload.wikimedia.org/wikipedia/en/6/67/Chicago_Bulls_logo.svg',
  'Cleveland Cavaliers': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cleveland_Cavaliers_logo.svg',
  'Cavaliers': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cleveland_Cavaliers_logo.svg',
  'Dallas Mavericks': 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg',
  'Mavericks': 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg',
  'Denver Nuggets': 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg',
  'Nuggets': 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg',
  'Detroit Pistons': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Logo_of_the_Detroit_Pistons.svg',
  'Pistons': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Logo_of_the_Detroit_Pistons.svg',
  'Golden State Warriors': 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
  'Warriors': 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
  'Houston Rockets': 'https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Rockets.svg',
  'Rockets': 'https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Rockets.svg',
  'Indiana Pacers': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Indiana_Pacers.svg',
  'Pacers': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Indiana_Pacers.svg',
  'LA Clippers': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Los_Angeles_Clippers_%282024%29.svg',
  'Clippers': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Los_Angeles_Clippers_%282024%29.svg',
  'Los Angeles Lakers': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
  'Lakers': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
  'Memphis Grizzlies': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Memphis_Grizzlies.svg',
  'Grizzlies': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Memphis_Grizzlies.svg',
  'Miami Heat': 'https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg',
  'Heat': 'https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg',
  'Milwaukee Bucks': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg',
  'Bucks': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg',
  'Minnesota Timberwolves': 'https://upload.wikimedia.org/wikipedia/en/c/c2/Minnesota_Timberwolves_logo.svg',
  'Timberwolves': 'https://upload.wikimedia.org/wikipedia/en/c/c2/Minnesota_Timberwolves_logo.svg',
  'New Orleans Pelicans': 'https://upload.wikimedia.org/wikipedia/en/0/0d/New_Orleans_Pelicans_logo.svg',
  'Pelicans': 'https://upload.wikimedia.org/wikipedia/en/0/0d/New_Orleans_Pelicans_logo.svg',
  'New York Knicks': 'https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg',
  'Knicks': 'https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg',
  'Oklahoma City Thunder': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Oklahoma_City_Thunder.svg',
  'Thunder': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Oklahoma_City_Thunder.svg',
  'Orlando Magic': 'https://upload.wikimedia.org/wikipedia/en/1/10/Orlando_Magic_logo.svg',
  'Magic': 'https://upload.wikimedia.org/wikipedia/en/1/10/Orlando_Magic_logo.svg',
  'Philadelphia 76ers': 'https://upload.wikimedia.org/wikipedia/en/0/0e/Philadelphia_76ers_logo.svg',
  '76ers': 'https://upload.wikimedia.org/wikipedia/en/0/0e/Philadelphia_76ers_logo.svg',
  'Phoenix Suns': 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg',
  'Suns': 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg',
  'Portland Trail Blazers': 'https://upload.wikimedia.org/wikipedia/en/2/21/Portland_Trail_Blazers_logo.svg',
  'Trail Blazers': 'https://upload.wikimedia.org/wikipedia/en/2/21/Portland_Trail_Blazers_logo.svg',
  'Sacramento Kings': 'https://upload.wikimedia.org/wikipedia/en/c/c7/SacramentoKings.svg',
  'Kings': 'https://upload.wikimedia.org/wikipedia/en/c/c7/SacramentoKings.svg',
  'San Antonio Spurs': 'https://upload.wikimedia.org/wikipedia/en/a/a2/San_Antonio_Spurs.svg',
  'Spurs': 'https://upload.wikimedia.org/wikipedia/en/a/a2/San_Antonio_Spurs.svg',
  'Toronto Raptors': 'https://upload.wikimedia.org/wikipedia/en/3/36/Toronto_Raptors_logo.svg',
  'Raptors': 'https://upload.wikimedia.org/wikipedia/en/3/36/Toronto_Raptors_logo.svg',
  'Utah Jazz': 'https://upload.wikimedia.org/wikipedia/en/0/04/Utah_Jazz_logo_%282022%29.svg',
  'Jazz': 'https://upload.wikimedia.org/wikipedia/en/0/04/Utah_Jazz_logo_%282022%29.svg',
  'Washington Wizards': 'https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg',
  'Wizards': 'https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg',

  'FC Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'FC BARCELONA': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'REAL MADRID': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Monaco': 'https://upload.wikimedia.org/wikipedia/fr/e/e7/AS_Monaco_Basket.svg',
  'AS Monaco': 'https://upload.wikimedia.org/wikipedia/fr/e/e7/AS_Monaco_Basket.svg',
  'AS MONACO': 'https://upload.wikimedia.org/wikipedia/fr/e/e7/AS_Monaco_Basket.svg',
  'ASVEL': 'https://upload.wikimedia.org/wikipedia/fr/3/3d/Logo_ASVEL_Basket.svg',
  'LDLC ASVEL VILLEURBANNE': 'https://upload.wikimedia.org/wikipedia/fr/3/3d/Logo_ASVEL_Basket.svg',
  'Paris Basketball': 'https://upload.wikimedia.org/wikipedia/fr/5/5e/Paris_Basketball_logo.svg',
  'Paris Bas': 'https://upload.wikimedia.org/wikipedia/fr/5/5e/Paris_Basketball_logo.svg',
  'PARIS BASKETBALL': 'https://upload.wikimedia.org/wikipedia/fr/5/5e/Paris_Basketball_logo.svg',
  
  'Olympiacos': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Olympiacos_BC_logo.svg',
  'OLYMPIACOS PIRAEUS': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Olympiacos_BC_logo.svg',
  'Panathinaikos': 'https://upload.wikimedia.org/wikipedia/en/1/1d/Panathinaikos_BC_logo.svg',
  'PANATHINAIKOS AKTOR ATHENS': 'https://upload.wikimedia.org/wikipedia/en/1/1d/Panathinaikos_BC_logo.svg',
  'Fenerbahçe': 'https://upload.wikimedia.org/wikipedia/en/8/85/Fenerbahce_basketball_logo.svg',
  'FENERBAHCE BEKO ISTANBUL': 'https://upload.wikimedia.org/wikipedia/en/8/85/Fenerbahce_basketball_logo.svg',
  'Maccabi Tel Aviv': 'https://upload.wikimedia.org/wikipedia/en/1/14/Maccabi_Tel_Aviv_B.C._logo.svg',
  'MACCABI RAPYD TEL AVIV': 'https://upload.wikimedia.org/wikipedia/en/1/14/Maccabi_Tel_Aviv_B.C._logo.svg',
  
  'Anadolu Efes': 'https://upload.wikimedia.org/wikipedia/en/2/2c/Anadolu_Efes_S.K._logo.svg',
  'ANADOLU EFES ISTANBUL': 'https://upload.wikimedia.org/wikipedia/en/2/2c/Anadolu_Efes_S.K._logo.svg',
  'Zalgiris': 'https://upload.wikimedia.org/wikipedia/en/9/9d/Zalgiris_Kaunas_logo.svg',
  'ZALGIRIS KAUNAS': 'https://upload.wikimedia.org/wikipedia/en/9/9d/Zalgiris_Kaunas_logo.svg',
  'Crvena Zvezda': 'https://upload.wikimedia.org/wikipedia/en/2/2b/KK_Crvena_zvezda_logo.svg',
  'CRVENA ZVEZDA MERIDIANBET BELGRADE': 'https://upload.wikimedia.org/wikipedia/en/2/2b/KK_Crvena_zvezda_logo.svg',
  'Partizan': 'https://upload.wikimedia.org/wikipedia/en/8/87/KK_Partizan_logo.svg',
  'PARTIZAN MOZZART BET BELGRADE': 'https://upload.wikimedia.org/wikipedia/en/8/87/KK_Partizan_logo.svg',
  'Baskonia': 'https://upload.wikimedia.org/wikipedia/en/7/7f/Saski_Baskonia_logo.svg',
  'BASKONIA VITORIA-GASTEIZ': 'https://upload.wikimedia.org/wikipedia/en/7/7f/Saski_Baskonia_logo.svg',
  'Virtus Bologna': 'https://upload.wikimedia.org/wikipedia/en/3/33/Virtus_Bologna_logo.svg',
  'VIRTUS BOLOGNA': 'https://upload.wikimedia.org/wikipedia/en/3/33/Virtus_Bologna_logo.svg',
  'EA7 Milano': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Olimpia_Milano_logo.svg',
  'EA7 EMPORIO ARMANI MILAN': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Olimpia_Milano_logo.svg',

  'Saint-Que': null,
  'Strasbour': null,
  'ESSM Le P': null,
  'SLUC Nanc': null,
  'Cholet': null,
  'Élan Cha': null,
  'Le Mans S': null,
  'Bourg-en-': null,
  'Lyon-Vill': null,
  'Graveline': null,
  'Nanterre': null,
  'Boulazac': null,
  'Limoges': null,
  'Dijon': null
};

const BROADCASTER_LOGOS = {
  'beIN Sports': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/BeIN_Sports_logo_2017.svg',
  'beIN SPORTS': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/BeIN_Sports_logo_2017.svg',
  'beIN SPORTS 1': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/BeIN_Sports_logo_2017.svg',
  
  'Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
  'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
  
  'La Chaîne L\'Équipe': null,
  'L\'Équipe': null,
  
  'DAZN': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/DAZN_Logo.svg',
  
  'SKWEEK': null,
  
  'NBA League Pass': null,
  'EuroLeague TV': null,
  'Courtside 1891': null,
  'TV Monaco': null
};

function getTeamLogo(teamName) {
  return TEAM_LOGOS[teamName] || null;
}

function getBroadcasterLogo(broadcasterName) {
  return BROADCASTER_LOGOS[broadcasterName] || null;
}

function normalizeLogoUrl(url) {
  if (!url) return null;
  
  if (url.includes('wikimedia.org') && url.includes('thumb')) {
    return url.replace(/\/thumb\/(.+)\/\d+px-(.+)$/, '/$1/$2');
  }
  
  return url;
}

module.exports = {
  getTeamLogo,
  getBroadcasterLogo,
  normalizeLogoUrl,
  TEAM_LOGOS,
  BROADCASTER_LOGOS
};
