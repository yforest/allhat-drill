// frontend/src/types/api.ts

export interface CustomFields {
  participants_count?: number | string | null;
  drill_types?: string | null;
  location_lat?: number | string | null;
  location_lng?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  drill_date?: string | null;
  [key: string]: any;
}

export interface DrillReport {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  acf?: CustomFields;
  featured_media?: number;
  [key: string]: any;
}

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