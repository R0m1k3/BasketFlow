require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initAdmin() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Un administrateur existe déjà');
      console.log('');
      checkJWTSecret();
      return;
    }

    const hashedPassword = await bcrypt.hash('admin', 10);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@basket.fr',
        password: hashedPassword,
        name: 'Administrateur',
        role: 'admin'
      }
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('');
    console.log('   👤 Identifiant: admin');
    console.log('   🔑 Mot de passe: admin');
    console.log('');

    await prisma.config.upsert({
      where: { key: 'OPENROUTER_API_KEY' },
      update: {},
      create: {
        key: 'OPENROUTER_API_KEY',
        value: process.env.OPENROUTER_API_KEY || '',
        description: 'Clé API pour OpenRouter'
      }
    });

    await prisma.config.upsert({
      where: { key: 'OPENROUTER_MODEL' },
      update: {},
      create: {
        key: 'OPENROUTER_MODEL',
        value: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash:free',
        description: 'Modèle LLM pour OpenRouter (par défaut: Gemini 2.5 Flash gratuit)'
      }
    });

    console.log('✅ Configuration OpenRouter initialisée');
    console.log('');
    
    checkJWTSecret();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

function checkJWTSecret() {
  if (!process.env.JWT_SECRET) {
    console.log('⚠️  ATTENTION: JWT_SECRET n\'est pas configuré !');
    console.log('');
    console.log('   Générez un secret aléatoire :');
    const randomSecret = crypto.randomBytes(32).toString('hex');
    console.log(`   JWT_SECRET=${randomSecret}`);
    console.log('');
    console.log('   Ajoutez cette ligne à votre fichier .env');
    console.log('');
  } else {
    console.log('✅ JWT_SECRET est configuré');
  }
}

initAdmin();
