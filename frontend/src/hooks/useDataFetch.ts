import { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import type { AppData, DrillReport, DrillChartData } from '../types/api';
import { CONFIG } from '../config';

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

function parseNumber(value: any): number | null {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

export function useDataFetch(): UseDataFetchResult {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<DrillReport[]>(CONFIG.ENDPOINTS.POSTS);
      const posts = Array.isArray(res.data) ? res.data : [];
      const effectivePosts = posts.length > 0 ? posts : MOCK_POSTS;

      const normalized = effectivePosts.map((post) => {
        const acf = post.acf ?? {};
        return {
          ...post,
          acf: {
            ...acf,
            participants_count: parseNumber(acf.participants_count),
            location_lat: parseNumber(acf.location_lat ?? acf.lat ?? acf.latitude),
            location_lng: parseNumber(acf.location_lng ?? acf.lng ?? acf.longitude),
          }
        };
      });

      let totalParticipants = 0;
      const typeCounts: Record<string, number> = {};

      normalized.forEach((post) => {
        const acf = post.acf ?? {};
        const pc = parseNumber(acf.participants_count) || 0;
        totalParticipants += pc;
        const typesRaw = String(acf.drill_types ?? '').trim();
        if (typesRaw) {
          typesRaw.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
        }
      });

      const chartData: DrillChartData[] = Object.entries(typeCounts).map(([name, value], idx) => ({
        name,
        value,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));

      setData({
        reports: normalized,
        totalParticipants,
        totalDrills: normalized.length,
        chartData,
      });
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      // フォールバック
      const posts = MOCK_POSTS;
      let totalParticipants = 0;
      const typeCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const pc = parseNumber(post.acf?.participants_count) || 0;
        totalParticipants += pc;
        const typesRaw = String(post.acf?.drill_types ?? '').trim();
        if (typesRaw) {
          typesRaw.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
        }
      });
      const chartData: DrillChartData[] = Object.entries(typeCounts).map(([name, value], idx) => ({
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