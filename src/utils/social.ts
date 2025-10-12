/**
 * Normalizes social media URLs
 * Takes a platform name and a value (URL or username) and returns a properly formatted URL
 */
export const normalizeSocialUrl = (platform: string, value: string): string => {
  if (!value) return '';
  
  // If it's already a full URL, return as is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  
  // Remove @ symbol if present
  const cleanValue = value.replace(/^@/, '');
  
  // Platform-specific URL formatting
  const platformUrls: Record<string, string> = {
    instagram: `https://instagram.com/${cleanValue}`,
    soundcloud: `https://soundcloud.com/${cleanValue}`,
    youtube: cleanValue.includes('channel/') || cleanValue.includes('c/') || cleanValue.includes('@')
      ? `https://youtube.com/${cleanValue}`
      : `https://youtube.com/@${cleanValue}`,
    spotify: cleanValue.includes('artist/') || cleanValue.includes('user/')
      ? `https://open.spotify.com/${cleanValue}`
      : `https://open.spotify.com/artist/${cleanValue}`,
    facebook: `https://facebook.com/${cleanValue}`,
    twitter: `https://twitter.com/${cleanValue}`,
    tiktok: `https://tiktok.com/@${cleanValue}`,
    twitch: `https://twitch.tv/${cleanValue}`,
  };
  
  return platformUrls[platform.toLowerCase()] || value;
};
