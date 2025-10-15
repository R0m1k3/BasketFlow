require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const matchRoutes = require('./routes/matches');
const leagueRoutes = require('./routes/leagues');
const broadcasterRoutes = require('./routes/broadcasters');
const updateService = require('./services/updateService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/matches', matchRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/broadcasters', broadcasterRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

cron.schedule('0 6 * * *', async () => {
  console.log('Running daily update job...');
  try {
    await updateService.updateMatches();
    console.log('Daily update completed successfully');
  } catch (error) {
    console.error('Daily update failed:', error);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏀 Backend server running on port ${PORT}`);
  console.log(`📅 Daily updates scheduled at 6:00 AM`);
});
