export interface YouTubeSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface YouTubeSong {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export const searchYouTube = async (query: string): Promise<YouTubeSong[]> => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!API_KEY) {
    console.error('YouTube API Key missing');
    return [];
  }
  
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`
    );
    const data = await res.json();
    
    if (data.error) {
      console.error('YouTube Search error:', data.error);
      return [];
    }

    return (data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (err) {
    console.error('YouTube Search failed:', err);
    return [];
  }
};

export const generateSongDecoys = async (realSong: YouTubeSong): Promise<YouTubeSong[]> => {
  // Search for generic songs or similar based on channelTitle
  const query = realSong.channelTitle || 'popular music 2024';
  const songs = await searchYouTube(query);
  
  // Filter out the real song and return 3 random decoys
  const filtered = songs.filter(s => s.videoId !== realSong.videoId);
  return filtered.sort(() => Math.random() - 0.5).slice(0, 3);
};

export const youtubeService = {
  getAuthUrl: async () => {
    const res = await fetch('/api/auth/google/url');
    const data = await res.json();
    return data.url;
  },

  createAndPopulatePlaylist: async (accessToken: string, title: string, videoIds: string[]) => {
    const res = await fetch('/api/youtube/create-and-populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, title, videoIds })
    });
    return await res.json();
  }
};
