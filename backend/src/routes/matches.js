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

router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const getParisDateBounds = (dateStr) => {
      const parisDateStart = new Date(dateStr + 'T00:00:00');
      const parisDateEnd = new Date(dateStr + 'T23:59:59.999');
      
      const parisOffsetStart = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris',
        timeZoneName: 'shortOffset'
      }).formatToParts(parisDateStart).find(p => p.type === 'timeZoneName')?.value || '+01';
      
      const offsetHours = parseInt(parisOffsetStart.replace('GMT', '').split(':')[0]) || 1;
      const offsetMs = offsetHours * 60 * 60 * 1000;
      
      const utcStart = new Date(parisDateStart.getTime() - offsetMs);
      const utcEnd = new Date(parisDateEnd.getTime() - offsetMs);
      
      return { start: utcStart, end: utcEnd };
    };
    
    const bounds = getParisDateBounds(date);

    const matches = await prisma.match.findMany({
      where: {
        dateTime: {
          gte: bounds.start,
          lte: bounds.end
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
