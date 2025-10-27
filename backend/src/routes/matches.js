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
        },
        league: {
          isActive: true
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
        },
        league: {
          isActive: true
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
      where: {
        leagueId,
        league: {
          isActive: true
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
    console.error('Error fetching league matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const getParisDateBounds = (dateStr) => {
      const parts = dateStr.split('-').map(Number);
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];
      
      const getLastSunday = (yr, mon) => {
        const lastDay = new Date(Date.UTC(yr, mon + 1, 0));
        const lastSunday = lastDay.getUTCDate() - lastDay.getUTCDay();
        return lastSunday;
      };
      
      const isDSTInParis = (yr, mon, d) => {
        const marchTransition = getLastSunday(yr, 2);
        const octoberTransition = getLastSunday(yr, 9);
        
        if (mon < 2 || mon > 9) return false;
        if (mon > 2 && mon < 9) return true;
        if (mon === 2 && d >= marchTransition) return true;
        if (mon === 9 && d < octoberTransition) return true;
        return false;
      };
      
      const isDST = isDSTInParis(year, month, day);
      const parisOffsetHours = isDST ? 2 : 1;
      const offsetMs = parisOffsetHours * 60 * 60 * 1000;
      
      const utcStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMs);
      const utcEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - offsetMs);
      
      return { start: utcStart, end: utcEnd };
    };
    
    const bounds = getParisDateBounds(date);

    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: bounds.start,
          lte: bounds.end
        },
        league: {
          isActive: true
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
    console.error('Error fetching matches by date:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;
