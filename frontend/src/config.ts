// src/config.ts
export const CONFIG = {
  BASE: "https://hitobou.com/allhat/drill/wpcms/wp-json",
  ENDPOINTS: {
    POSTS: "/wp/v2/posts",
    MEDIA: "/wp/v2/media",
    TOKEN: "/jwt-auth/v1/token",
    ACF_FIELDS: "/acf/v3/field-groups"
  }
};

export default CONFIG;