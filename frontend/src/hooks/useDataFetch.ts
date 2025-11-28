import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import CONFIG from "../config";
import type { DrillReport, AppData, DrillChartData } from "../types/api";

type UseDataFetchResult = {
  data: AppData | null;
  isLoading: boolean;
  error: any | null;
  refetch: () => Promise<void>;
};

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isNaN(v) ? null : v;
  const s = String(v).replace(/[^\d\.\-]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export default function useDataFetch(): UseDataFetchResult {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(CONFIG.ENDPOINTS.POSTS + "?per_page=100&acf_format=standard");
      const posts = Array.isArray(res.data) ? res.data : [];

      const reports: DrillReport[] = posts.map((p: any) => {
        const acf = p.acf || {};
        const latCandidates = [acf.lat, acf.location_lat, acf.latitude, p.meta?.lat];
        const lngCandidates = [acf.lng, acf.location_lng, acf.longitude, p.meta?.lng];

        const lat = (() => {
          for (const c of latCandidates) {
            const n = parseNumber(c);
            if (n !== null) return n;
          }
          return null;
        })();

        const lng = (() => {
          for (const c of lngCandidates) {
            const n = parseNumber(c);
            if (n !== null) return n;
          }
          return null;
        })();

        const participants = parseNumber(acf.participants_count ?? acf.participant_count ?? acf.participants) ?? null;

        return {
          id: p.id,
          title: typeof p.title === "object" ? p.title?.rendered ?? "" : p.title ?? "",
          content: typeof p.content === "object" ? p.content?.rendered ?? "" : p.content ?? "",
          date: p.date ?? p.modified ?? null,
          acf: {
            lat: lat,
            lng: lng,
            drill_date: acf.drill_date ?? null,
            participants_count: participants,
            drill_types: Array.isArray(acf.drill_types) ? acf.drill_types : (acf.drill_types ? [acf.drill_types] : [])
          },
          featured_media: p.featured_media ?? null,
          raw: p
        } as DrillReport;
      });

      // 集計とチャートデータ作成
      let totalParticipants = 0;
      const drillTypeCounts: Record<string, number> = {};

      for (const r of reports) {
        const pc = typeof r.acf?.participants_count === "number" ? r.acf.participants_count : parseNumber(r.acf?.participants_count) ?? 0;
        totalParticipants += pc;

        const dts = Array.isArray(r.acf?.drill_types) ? r.acf!.drill_types : [];
        for (const dt of dts) {
          if (!dt) continue;
          drillTypeCounts[dt] = (drillTypeCounts[dt] || 0) + 1;
        }
      }

      const chartData: DrillChartData[] = Object.keys(drillTypeCounts).map(key => ({
        name: key,
        value: drillTypeCounts[key],
        color: "#60A5FA" // デフォルト色（必要なら色割り当てロジックを追加）
      }));

      const appData: AppData = {
        reports,
        totalParticipants,
        totalDrills: reports.length,
        chartData
      };

      setData(appData);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}