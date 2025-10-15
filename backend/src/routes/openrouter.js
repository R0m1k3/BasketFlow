const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/models', async (req, res) => {
  try {
    const apiKeyConfig = await prisma.config.findUnique({
      where: { key: 'OPENROUTER_API_KEY' }
    });

    if (!apiKeyConfig || !apiKeyConfig.value) {
      return res.status(400).json({ 
        error: 'Clé API OpenRouter non configurée',
        models: []
      });
    }

    const openrouter = new OpenAI({
      apiKey: apiKeyConfig.value,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const response = await openrouter.models.list();
    
    const models = response.data.map(model => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      pricing: model.pricing,
      context_length: model.context_length,
      isFree: model.id.includes(':free') || 
              (model.pricing && 
               model.pricing.prompt === '0' && 
               model.pricing.completion === '0')
    }));

    const freeModels = models.filter(m => m.isFree);
    const paidModels = models.filter(m => !m.isFree);

    res.json({
      freeModels,
      paidModels,
      allModels: models
    });

  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Clé API OpenRouter invalide',
        models: []
      });
    }

    res.status(500).json({ 
      error: 'Erreur lors de la récupération des modèles OpenRouter',
      details: error.message,
      models: []
    });
  }
});

router.get('/test', async (req, res) => {
  try {
    const apiKeyConfig = await prisma.config.findUnique({
      where: { key: 'OPENROUTER_API_KEY' }
    });

    const modelConfig = await prisma.config.findUnique({
      where: { key: 'OPENROUTER_MODEL' }
    });

    if (!apiKeyConfig || !apiKeyConfig.value) {
      return res.status(400).json({ 
        success: false,
        error: 'Clé API OpenRouter non configurée'
      });
    }

    if (!modelConfig || !modelConfig.value) {
      return res.status(400).json({ 
        success: false,
        error: 'Modèle OpenRouter non configuré'
      });
    }

    const openrouter = new OpenAI({
      apiKey: apiKeyConfig.value,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const completion = await openrouter.chat.completions.create({
      model: modelConfig.value,
      messages: [
        { 
          role: 'user', 
          content: 'Réponds simplement "OK" si tu fonctionnes correctement.' 
        }
      ],
      max_tokens: 10
    });

    res.json({
      success: true,
      model: modelConfig.value,
      response: completion.choices[0].message.content,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Error testing OpenRouter:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du test OpenRouter',
      details: error.message
    });
  }
});

module.exports = router;
