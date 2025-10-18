require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { autoInit } = require('./autoInit');
const matchRoutes = require('./routes/matches');
const leagueRoutes = require('./routes/leagues');
const broadcasterRoutes = require('./routes/broadcasters');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const imageProxyRoutes = require('./routes/imageProxy');
const updateService = require('./services/updateService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/broadcasters', broadcasterRoutes);
app.use('/api/image-proxy', imageProxyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React static files (production build)
// Go up one level from backend dir to workspace root, then to frontend/build
const frontendBuildPath = path.join(process.cwd(), '../frontend/build');
console.log(`📂 Serving frontend from: ${frontendBuildPath}`);
app.use(express.static(frontendBuildPath));

// All non-API routes return React app
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
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

// Auto-initialize database on startup and start server
(async () => {
  await autoInit();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏀 Backend server running on port ${PORT}`);
    console.log(`📅 Daily updates scheduled at 6:00 AM`);
  });
})();
