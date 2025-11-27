// src/types/api.ts

export interface CustomFields {
  participants_count?: number | string;
  drill_types?: string; // カンマ区切りの文字列を想定
  location_lat?: number | string;
  location_lng?: number | string;
  // 必要に応じて他のacfフィールドを追加
}

export interface DrillReport {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  acf?: CustomFields;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface AppData {
  reports: DrillReport[];
  totalParticipants: number;
  totalDrills: number;
  chartData: ChartData[];
}