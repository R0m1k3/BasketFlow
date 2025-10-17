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

  'New York Liberty': 'https://upload.wikimedia.org/wikipedia/en/1/1b/New_York_Liberty_logo.svg',
  'Las Vegas Aces': 'https://upload.wikimedia.org/wikipedia/en/8/8d/Las_Vegas_Aces_logo.svg',
  'Chicago Sky': 'https://upload.wikimedia.org/wikipedia/en/b/b2/Chicago_Sky.svg',
  'Connecticut Sun': 'https://upload.wikimedia.org/wikipedia/en/9/94/Connecticut_Sun_logo.svg',
  'Seattle Storm': 'https://upload.wikimedia.org/wikipedia/en/9/9d/Seattle_Storm_logo.svg',
  'Minnesota Lynx': 'https://upload.wikimedia.org/wikipedia/en/7/7d/Minnesota_Lynx_logo.svg',
  'Atlanta Dream': 'https://upload.wikimedia.org/wikipedia/en/6/6a/Atlanta_Dream_logo.svg',
  'Phoenix Mercury': 'https://upload.wikimedia.org/wikipedia/en/4/40/Phoenix_Mercury_logo.svg',
  'Indiana Fever': 'https://upload.wikimedia.org/wikipedia/en/5/52/Indiana_Fever_logo.svg',
  'Dallas Wings': 'https://upload.wikimedia.org/wikipedia/en/5/5c/Dallas_Wings_logo.svg',
  'Los Angeles Sparks': 'https://upload.wikimedia.org/wikipedia/en/9/97/Los_Angeles_Sparks.svg',
  'Washington Mystics': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Washington_Mystics_logo.svg',

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
  'Maccabi Tel Aviv': 'https://r2.thesportsdb.com/images/media/team/badge/io01a91521148756.png/preview',
  'MACCABI RAPYD TEL AVIV': 'https://r2.thesportsdb.com/images/media/team/badge/io01a91521148756.png/preview',
  
  'Anadolu Efes': 'https://www.thesportsdb.com/images/media/team/badge/ly2g231758537717.png/preview',
  'ANADOLU EFES ISTANBUL': 'https://www.thesportsdb.com/images/media/team/badge/ly2g231758537717.png/preview',
  'Zalgiris': 'https://r2.thesportsdb.com/images/media/team/badge/dn7ouv1703960565.png/preview',
  'ZALGIRIS KAUNAS': 'https://r2.thesportsdb.com/images/media/team/badge/dn7ouv1703960565.png/preview',
  'Crvena Zvezda': 'https://r2.thesportsdb.com/images/media/team/badge/10js2d1673366487.png/preview',
  'CRVENA ZVEZDA MERIDIANBET BELGRADE': 'https://r2.thesportsdb.com/images/media/team/badge/10js2d1673366487.png/preview',
  'Partizan': 'https://r2.thesportsdb.com/images/media/team/badge/6ej8w01673366572.png/preview',
  'PARTIZAN MOZZART BET BELGRADE': 'https://r2.thesportsdb.com/images/media/team/badge/6ej8w01673366572.png/preview',
  'Baskonia': 'https://r2.thesportsdb.com/images/media/team/badge/sudyqn1664475510.png/preview',
  'BASKONIA VITORIA-GASTEIZ': 'https://r2.thesportsdb.com/images/media/team/badge/sudyqn1664475510.png/preview',
  'Virtus Bologna': 'https://r2.thesportsdb.com/images/media/team/badge/bwm0an1739659116.png/preview',
  'VIRTUS BOLOGNA': 'https://r2.thesportsdb.com/images/media/team/badge/bwm0an1739659116.png/preview',
  'EA7 Milano': 'https://r2.thesportsdb.com/images/media/team/badge/fo4c931755530108.png/preview',
  'EA7 EMPORIO ARMANI MILAN': 'https://r2.thesportsdb.com/images/media/team/badge/fo4c931755530108.png/preview',
  
  'DUBAI BASKETBALL': 'https://www.thesportsdb.com/images/media/team/badge/fgtnti1758215967.png/preview',
  'FC BAYERN MUNICH': 'https://r2.thesportsdb.com/images/media/team/badge/z2r3eh1678017187.png/preview',
  'VALENCIA BASKET': 'https://r2.thesportsdb.com/images/media/team/badge/9qyc231536398868.png/preview',
  'HAPOEL IBI TEL AVIV': 'https://r2.thesportsdb.com/images/media/team/badge/7lwa0u1522257633.png/preview',

  'Saint-Que': 'https://r2.thesportsdb.com/images/media/team/badge/x1jnik1697128652.png/preview',
  'Strasbour': 'https://r2.thesportsdb.com/images/media/team/badge/1opi561726732886.png/preview',
  'ESSM Le P': 'https://r2.thesportsdb.com/images/media/team/badge/yhwnwu1649168935.png/preview',
  'SLUC Nanc': 'https://r2.thesportsdb.com/images/media/team/badge/6zbuwh1666897360.png/preview',
  'Cholet': 'https://r2.thesportsdb.com/images/media/team/badge/rjb2631570976454.png/preview',
  'Élan Cha': 'https://r2.thesportsdb.com/images/media/team/badge/f7jcdk1542825634.png/preview',
  'Le Mans S': 'https://r2.thesportsdb.com/images/media/team/badge/iouj5l1757607112.png/preview',
  'Bourg-en-': 'https://r2.thesportsdb.com/images/media/team/badge/643qz71523101349.png/preview',
  'Lyon-Vill': 'https://r2.thesportsdb.com/images/media/team/badge/qbaoia1602706639.png/preview',
  'Graveline': 'https://r2.thesportsdb.com/images/media/team/badge/1mft2j1757606561.png/preview',
  'Nanterre': 'https://r2.thesportsdb.com/images/media/team/badge/hdqr5m1523101484.png/preview',
  'Boulazac': 'https://r2.thesportsdb.com/images/media/team/badge/68tu9p1570976593.png/preview',
  'Limoges': 'https://r2.thesportsdb.com/images/media/team/badge/rryxux1423605495.png/preview',
  'Dijon': 'https://r2.thesportsdb.com/images/media/team/badge/06b1fd1666897191.png/preview',
  'Paris Bas': 'https://r2.thesportsdb.com/images/media/team/badge/9q0d6x1726681476.png/preview'
};

const BROADCASTER_LOGOS = {
  'beIN Sports': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  'beIN SPORTS': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  'beIN SPORTS 1': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  'beIN Sports 1': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  'beIN Sports 2': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  'beIN Sports 3': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg',
  
  'Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
  'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
  
  'La Chaîne L\'Équipe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/La_chaîne_l%27Equipe_-_logo_2016.png/640px-La_chaîne_l%27Equipe_-_logo_2016.png',
  'L\'Équipe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/La_chaîne_l%27Equipe_-_logo_2016.png/640px-La_chaîne_l%27Equipe_-_logo_2016.png',
  
  'DAZN': 'https://upload.wikimedia.org/wikipedia/commons/8/84/DAZN_logo.svg',
  
  'SKWEEK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Skweek_logo.svg/640px-Skweek_logo.svg.png',
  
  'NBA League Pass': 'https://cdn.worldvectorlogo.com/logos/nba-league-pass.svg',
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
