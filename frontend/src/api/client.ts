// src/api/client.ts
import axios from 'axios';
import { CONFIG } from '../config';

export const apiClient = axios.create({
  baseURL: CONFIG.BASE,
  // 必要ならタイムアウトをここで指定
  timeout: 10000,
});

// リクエストインターセプター：localStorage にあれば自動で Authorization を付与
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('allhat_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage がアクセスできない環境でも落ちない
  }
  return config;
}, (error) => Promise.reject(error));

export default apiClient;