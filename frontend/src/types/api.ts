// frontend/src/types/api.ts

export type CustomFields = {
  lat?: number | string | null;
  lng?: number | string | null;
  drill_date?: string | null;
  participants_count?: number | string | null;
  drill_types?: string[] | string | null;
  // 追加の ACF フィールドがある場合は許容
  [key: string]: any;
};

export type DrillReport = {
  id: number;
  title: string;
  content: string;
  date: string | null;
  acf: CustomFields;
  featured_media?: number | null;
  raw?: any;
};

// recharts との互換性のためインデックスシグネチャを追加
export interface DrillChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;  // この行を追加
}

export interface AppData {
  reports: DrillReport[];
  totalParticipants: number;
  totalDrills: number;
  chartData: DrillChartData[];
}