const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/week', async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        broadcasts: {
          include: {
            broadcaster: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Error fetching week matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        broadcasts: {
          include: {
            broadcaster: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Error fetching month matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const matches = await prisma.match.findMany({
      where: { leagueId },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        broadcasts: {
          include: {
            broadcaster: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Error fetching league matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;
