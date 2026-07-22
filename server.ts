import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import billingRouter from './server/routes/billing';
import aiRouter from './server/routes/ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OAuth Configurations
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const RAPID_API_KEY = process.env.RAPID_API_KEY || '1b9614d043mshc6dde8b39af9632p12b15fjsnf02809fb039b';

  // --- HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // --- SPOTIFY ROUTES ---
  app.get('/api/auth/spotify/url', (req, res) => {
    const origin = req.headers.origin || process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${origin}/auth/callback`;
    
    const scope = 'playlist-modify-public playlist-modify-private user-read-private';
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scope,
      show_dialog: 'true'
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/callback`;
    
    if (!code) return res.status(400).send('No code provided');

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const data = await response.json() as any;
      if (data.error) return res.status(500).send(`Error: ${data.error_description || data.error}`);

      const userRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + data.access_token }
      });
      const userData = await userRes.json() as any;

      const authData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: userData.id
      };

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', payload: ${JSON.stringify(authData)} }, '*');
                window.close();
              } else { window.location.href = '/'; }
            </script>
            <p>Authentication successful.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  app.post('/api/spotify/add-tracks', async (req, res) => {
    const { accessToken, userId, playlistId, tracks } = req.body;
    try {
      const response = await fetch('https://spotifystefan-skliarovv1.p.rapidapi.com/addTracksToPlaylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-rapidapi-host': 'Spotifystefan-skliarovV1.p.rapidapi.com',
          'x-rapidapi-key': RAPID_API_KEY
        },
        body: new URLSearchParams({ userId, accessToken, playlistId, tracks })
      });
      res.json(await response.json());
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/spotify/create-playlist', async (req, res) => {
    const { accessToken, userId, name } = req.body;
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name || 'Musify Favorites', description: 'Created via Musify', public: true })
      });
      res.json(await response.json());
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // --- GOOGLE / YOUTUBE ROUTES ---
  app.get('/api/auth/google/url', (req, res) => {
    const origin = req.headers.origin || process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube',
      access_type: 'offline',
      prompt: 'consent'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/google/callback`;
    if (!code) return res.status(400).send('No code provided');
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      const data = await response.json() as any;
      if (data.error) return res.status(500).send(`Error: ${data.error_description || data.error}`);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', payload: ${JSON.stringify(data)} }, '*');
                window.close();
              } else { window.location.href = '/'; }
            </script>
            <p>Authentication successful.</p>
          </body>
        </html>
      `);
    } catch (err: any) { res.status(500).send(`Google auth failed: ${err.message}`); }
  });

  app.post('/api/youtube/create-and-populate', async (req, res) => {
    const { accessToken, title, videoIds } = req.body;
    try {
      const playlistRes = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: { title, description: 'Created via Musify' },
          status: { privacyStatus: 'public' }
        })
      });
      const playlist = await playlistRes.json() as any;
      if (playlist.error) throw new Error(playlist.error.message);

      for (const videoId of videoIds) {
        await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippet: { playlistId: playlist.id, resourceId: { kind: 'youtube#video', videoId } }
          })
        });
      }
      res.json({ success: true, playlistId: playlist.id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // --- SECURE SERVER-SIDE BILLING (NARDOPAY INTEGRATION) ---
  app.use('/api/billing', billingRouter);

  // --- AI & MERCHANT PRODUCTIVITY SERVICES ---
  app.use('/api/ai', aiRouter);

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => { console.log(`Server running on http://localhost:${PORT}`); });
}

startServer();
