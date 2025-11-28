// src/config.ts
export const CONFIG = {
  BASE: (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json',
  ENDPOINTS: {
    POSTS: '/wp/v2/posts',
    MEDIA: '/wp/v2/media',
    TOKEN: '/jwt-auth/v1/token',
  },
};