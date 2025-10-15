const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

const imageCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(imageUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const request = protocol.get(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BasketFlow/1.0)',
          'Accept': 'image/*'
        },
        timeout: 10000
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            contentType
          });
        });
        response.on('error', reject);
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    } catch (error) {
      reject(error);
    }
  });
}

function cleanCache() {
  if (imageCache.size > CACHE_MAX_SIZE) {
    const entriesToDelete = imageCache.size - CACHE_MAX_SIZE;
    const keysToDelete = Array.from(imageCache.keys()).slice(0, entriesToDelete);
    keysToDelete.forEach(key => imageCache.delete(key));
  }

  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_MAX_AGE) {
      imageCache.delete(key);
    }
  }
}

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    const cached = imageCache.get(url);
    if (cached) {
      res.set('Content-Type', cached.contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');
      return res.send(cached.buffer);
    }

    const { buffer, contentType } = await downloadImage(url);

    imageCache.set(url, {
      buffer,
      contentType,
      timestamp: Date.now()
    });

    cleanCache();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buffer);

  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

module.exports = router;
