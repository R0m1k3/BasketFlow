const TEAM_LOGOS = {
  'Boston Celtics': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/1200px-Boston_Celtics.svg.png',
  'Los Angeles Lakers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/1200px-Los_Angeles_Lakers_logo.svg.png',
  'Golden State Warriors': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/1200px-Golden_State_Warriors_logo.svg.png',
  'Chicago Bulls': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Chicago_Bulls_logo.svg/1200px-Chicago_Bulls_logo.svg.png',
  'Miami Heat': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/Miami_Heat_logo.svg/1200px-Miami_Heat_logo.svg.png',
  'Brooklyn Nets': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Brooklyn_Nets_newlogo.svg/1200px-Brooklyn_Nets_newlogo.svg.png',
  
  'New York Liberty': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/New_York_Liberty_logo.svg/1200px-New_York_Liberty_logo.svg.png',
  'Las Vegas Aces': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Las_Vegas_Aces_logo.svg/1200px-Las_Vegas_Aces_logo.svg.png',
  'Chicago Sky': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Chicago_Sky.svg/1200px-Chicago_Sky.svg.png',
  
  'FC Barcelona': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/af/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png',
  'Monaco': 'https://upload.wikimedia.org/wikipedia/fr/thumb/e/e7/AS_Monaco_Basket.svg/1200px-AS_Monaco_Basket.svg.png',
  'ASVEL': 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3d/Logo_ASVEL_Basket.svg/1200px-Logo_ASVEL_Basket.svg.png',
  'Paris Basketball': 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5e/Paris_Basketball_logo.svg/1200px-Paris_Basketball_logo.svg.png',
  
  'Olympiacos': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Olympiacos_BC_logo.svg/1200px-Olympiacos_BC_logo.svg.png',
  'Panathinaikos': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/Panathinaikos_BC_logo.svg/1200px-Panathinaikos_BC_logo.svg.png',
  'Fenerbahçe': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Fenerbahce_basketball_logo.svg/1200px-Fenerbahce_basketball_logo.svg.png',
  'Maccabi Tel Aviv': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Maccabi_Tel_Aviv_B.C._logo.svg/1200px-Maccabi_Tel_Aviv_B.C._logo.svg.png'
};

const BROADCASTER_LOGOS = {
  'beIN Sports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/BeIN_Sports_2012_logo.svg/1200px-BeIN_Sports_2012_logo.svg.png',
  'beIN SPORTS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/BeIN_Sports_2012_logo.svg/1200px-BeIN_Sports_2012_logo.svg.png',
  'beIN SPORTS 1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/BeIN_Sports_2012_logo.svg/1200px-BeIN_Sports_2012_logo.svg.png',
  
  'Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Prime_Video.png/1200px-Prime_Video.png',
  'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Prime_Video.png/1200px-Prime_Video.png',
  
  'La Chaîne L\'Équipe': null,
  'L\'Équipe': null,
  
  'DAZN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/DAZN_Logo.svg/1200px-DAZN_Logo.svg.png',
  
  'SKWEEK': null,
  
  'NBA League Pass': null,
  'EuroLeague TV': null
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
