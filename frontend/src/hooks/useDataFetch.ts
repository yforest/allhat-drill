import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import type { AppData, DrillReport, ChartData } from '../types/api';

const DEFAULT_API_URL = 'https://hitobou.com/allhat/drill/wpcms/wp-json/wp/v2/posts';
const API_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_URL;
const API_BASE = API_URL.replace(/\/wp\/v2\/posts\/?$/, '') || (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json';

const COLOR_PALETTE = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export type UseDataFetchResult = {
  data: AppData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const MOCK_POSTS: DrillReport[] = [
  {
    id: 1,
    date: new Date().toISOString(),
    title: { rendered: 'モック: シェイクアウト' },
    content: { rendered: 'モックデータ' },
    acf: { participants_count: 100, drill_types: 'シェイクアウト', location_lat: 34.697, location_lng: 135.216 }
  },
  {
    id: 2,
    date: new Date().toISOString(),
    title: { rendered: 'モック: 炊き出し' },
    content: { rendered: 'モックデータ2' },
    acf: { participants_count: 50, drill_types: '炊き出し', location_lat: 34.698, location_lng: 135.217 }
  }
];

export function useDataFetch(): UseDataFetchResult {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // JWT取得（あれば含める、なくても取得試行）
      const token = localStorage.getItem('jwt_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get<DrillReport[]>(API_URL, { timeout: 8000, headers });
      const posts = Array.isArray(res.data) ? res.data : [];
      const effectivePosts = posts.length > 0 ? posts : MOCK_POSTS;

      const normalizedPosts = effectivePosts.map((post) => {
        const acf = post.acf ?? {};
        const parseNum = (v: any) => {
          if (v == null || v === '') return null;
          const n = Number(String(v).replace(/[^\d.\-]/g, ''));
          return Number.isNaN(n) ? null : n;
        };
        return {
          ...post,
          acf: {
            ...acf,
            participants_count: parseNum(acf.participants_count),
            // location_lat / location_lng を優先、互換性のため lat/lng も参照
            location_lat: parseNum(acf.location_lat ?? acf.lat ?? acf.latitude),
            location_lng: parseNum(acf.location_lng ?? acf.lng ?? acf.longitude),
          }
        };
      });

      let totalParticipants = 0;
      const typeCounts: Record<string, number> = {};

      normalizedPosts.forEach((post) => {
        const acf = post.acf ?? {};
        const pc = acf.participants_count ?? 0;
        const pcNum = typeof pc === 'string' ? parseInt(pc.replace(/[^\d]/g, ''), 10) || 0 : Number(pc) || 0;
        totalParticipants += pcNum;

        const typesRaw = (acf.drill_types ?? '').toString();
        if (typesRaw.trim() !== '') {
          const types = typesRaw.split(',').map((t) => t.trim()).filter(Boolean);
          types.forEach((t) => {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
        }
      });

      const chartData: ChartData[] = Object.entries(typeCounts).map(([name, value], idx) => ({
        name,
        value,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));

      const appData: AppData = {
        reports: normalizedPosts,
        totalParticipants,
        totalDrills: normalizedPosts.length,
        chartData,
      };

      setData(appData);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      // フォールバック
      const posts = MOCK_POSTS;
      let totalParticipants = 0;
      const typeCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const acf = post.acf ?? {};
        const pc = acf.participants_count ?? 0;
        const pcNum = typeof pc === 'string' ? parseInt(pc.replace(/[^\d]/g, ''), 10) || 0 : Number(pc) || 0;
        totalParticipants += pcNum;
        const typesRaw = (acf.drill_types ?? '').toString();
        if (typesRaw.trim() !== '') {
          const types = typesRaw.split(',').map((t) => t.trim()).filter(Boolean);
          types.forEach((t) => (typeCounts[t] = (typeCounts[t] || 0) + 1));
        }
      });
      const chartData: ChartData[] = Object.entries(typeCounts).map(([name, value], idx) => ({
        name,
        value,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));
      setData({ reports: posts, totalParticipants, totalDrills: posts.length, chartData });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const refetch = async () => {
    await fetchData();
  };

  return { data, isLoading, error, refetch };
}