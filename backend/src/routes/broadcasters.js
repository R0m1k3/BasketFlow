const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const broadcasters = await prisma.broadcaster.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(broadcasters);
  } catch (error) {
    console.error('Error fetching broadcasters:', error);
    res.status(500).json({ error: 'Failed to fetch broadcasters' });
  }
});

module.exports = router;
