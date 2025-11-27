// src/hooks/useDataFetch.ts
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { AppData, DrillReport, ChartData } from '../types/api';

const DEFAULT_API_URL = 'https://hitobou.com/allhat/drill/wpcms/wp-json/wp/v2/posts';
const API_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_URL;

const COLOR_PALETTE = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// 簡易モック（API未準備時のフォールバック）
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

type UseDataFetchResult = {
  data: AppData | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDataFetch(): UseDataFetchResult {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await axios.get<DrillReport[]>(API_URL, { timeout: 8000 });
        const posts = Array.isArray(res.data) ? res.data : [];

        const effectivePosts = posts.length > 0 ? posts : MOCK_POSTS;

        let totalParticipants = 0;
        const typeCounts: Record<string, number> = {};

        effectivePosts.forEach((post) => {
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

        const appData: AppData = {
          reports: effectivePosts,
          totalParticipants,
          totalDrills: effectivePosts.length,
          chartData,
        };

        if (!cancelled) setData(appData);
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // フォールバックで最低限動作させる
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
          const appData: AppData = {
            reports: posts,
            totalParticipants,
            totalDrills: posts.length,
            chartData,
          };
          setData(appData);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}