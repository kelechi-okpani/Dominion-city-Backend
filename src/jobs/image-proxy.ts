import axios from 'axios';
import { Request, Response } from 'express';

export const handleImageProxy = async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) return res.status(400).send('URL is required');

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      proxy: {
        protocol: 'http',
        host: 'proxy.apify.com',
        port: 8000,
        auth: {
          username: 'groups-RESIDENTIAL',
          password: process.env.APIFY_TOKEN 
        } as any
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); 
    res.send(response.data);
  } catch (error) {
    // If proxy fails, try direct fetch as fallback
    try {
      const fallback = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      res.set('Content-Type', fallback.headers['content-type']);
      res.send(fallback.data);
    } catch (e) {
      res.status(500).send('Proxy Error');
    }
  }
};