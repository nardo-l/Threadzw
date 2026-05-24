export interface SpotifySession {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: number;
}

export const spotifyService = {
  getAuthUrl: async () => {
    const res = await fetch('/api/auth/spotify/url');
    const data = await res.json();
    return data.url;
  },

  createPlaylist: async (session: SpotifySession, name: string) => {
    const res = await fetch('/api/spotify/create-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accessToken: session.access_token,
        userId: session.user_id,
        name 
      })
    });
    return await res.json();
  },

  addTracks: async (session: SpotifySession, playlistId: string, tracks: string) => {
    const res = await fetch('/api/spotify/add-tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: session.access_token,
        userId: session.user_id,
        playlistId: playlistId,
        tracks: tracks // Comma separated track URIs usually for this API
      })
    });
    return await res.json();
  }
};
