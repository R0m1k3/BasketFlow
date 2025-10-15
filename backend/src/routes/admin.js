const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/config', async (req, res) => {
  try {
    const configs = await prisma.config.findMany();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

router.put('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const config = await prisma.config.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    res.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'user'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
});

module.exports = router;
