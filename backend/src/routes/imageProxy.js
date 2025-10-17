const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

const imageCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_DOMAINS = [
  'upload.wikimedia.org',
  'www.wikimedia.org',
  'commons.wikimedia.org',
  'cdn.nba.com',
  'www.nba.com',
  'cdn.wnba.com',
  'www.wnba.com',
  'wnba.com',
  'euroleague.net',
  'www.euroleague.net',
  'www.fiba.basketball',
  'cdn.fiba.com',
  'i.imgur.com',
  'cloudinary.com',
  'logos-marques.com',
  'asmonaco.basketball',
  'www.asmonaco.basketball',
  'parisbasketball.com',
  'www.parisbasketball.com',
  'jdadijon.com',
  'thelondonlions.com',
  'www.thelondonlions.com',
  'hapoeluta.com',
  'www.hapoeluta.com',
  'sigstrasbourg.fr',
  'www.sigstrasbourg.fr',
  'logoeps.com',
  'seeklogo.com',
  'brandslogos.com',
  'pngimg.com',
  'freepnglogos.com',
  'r2.thesportsdb.com',
  'thesportsdb.com',
  'www.thesportsdb.com',
  'cdn.worldvectorlogo.com',
  'worldvectorlogo.com',
  'app.skweek.tv',
  'i0.wp.com'
];

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
          const error = new Error(`HTTP ${response.statusCode}`);
          error.statusCode = response.statusCode;
          reject(error);
          return;
        }

        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (contentLength > MAX_IMAGE_SIZE) {
          reject(new Error(`Image too large: ${contentLength} bytes`));
          return;
        }

        const chunks = [];
        let receivedBytes = 0;

        response.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_IMAGE_SIZE) {
            request.destroy();
            reject(new Error('Image size exceeded limit'));
            return;
          }
          chunks.push(chunk);
        });

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
  const now = Date.now();
  
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_MAX_AGE) {
      imageCache.delete(key);
    }
  }
  
  if (imageCache.size > CACHE_MAX_SIZE) {
    const sortedEntries = Array.from(imageCache.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    const entriesToDelete = imageCache.size - CACHE_MAX_SIZE;
    for (let i = 0; i < entriesToDelete; i++) {
      imageCache.delete(sortedEntries[i][0]);
    }
  }
}

function isAllowedDomain(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
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

    if (!isAllowedDomain(url)) {
      console.warn(`Blocked proxy request to unauthorized domain: ${url}`);
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    const cached = imageCache.get(url);
    if (cached) {
      cached.lastUsed = Date.now();
      res.set('Content-Type', cached.contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');
      return res.send(cached.buffer);
    }

    const { buffer, contentType } = await downloadImage(url);

    imageCache.set(url, {
      buffer,
      contentType,
      timestamp: Date.now(),
      lastUsed: Date.now()
    });

    cleanCache();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buffer);

  } catch (error) {
    const statusCode = error.statusCode || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;
    const { url } = req.query;
    
    if (isClientError) {
      console.warn(`Image proxy client error (${statusCode}):`, url, error.message);
    } else {
      console.error(`Image proxy server error (${statusCode}):`, url, error.message);
    }
    
    res.status(statusCode).json({ 
      error: 'Failed to fetch image',
      details: error.message 
    });
  }
});

module.exports = router;
