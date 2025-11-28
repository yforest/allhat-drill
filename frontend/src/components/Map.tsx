import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useMemo, useState, useEffect } from "react";
import apiClient from "../api/client";
import type { DrillReport } from "../types/api";
import L from "leaflet";

// Vite 環境でのアイコンURL解決（marker PNG が正しく参照されるように）
const defaultIconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href;
const defaultRetinaIconUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href;
const defaultShadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href;

;(L as any).Icon.Default.mergeOptions({
  iconUrl: defaultIconUrl,
  iconRetinaUrl: defaultRetinaIconUrl,
  shadowUrl: defaultShadowUrl
});

type Props = {
  reports: DrillReport[] | null;
};

export default function Map({ reports }: Props) {
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchMediaFor(reportsList: DrillReport[]) {
      const map: Record<number, string> = {};
      await Promise.all(
        (reportsList || []).map(async (r) => {
          if (r.featured_media) {
            try {
              const res = await apiClient.get(`/wp/v2/media/${r.featured_media}`);
              map[r.featured_media] = res?.data?.source_url;
            } catch {
              // ignore
            }
          }
        })
      );
      setMediaMap(map);
    }
    if (reports && reports.length > 0) fetchMediaFor(reports);
  }, [reports]);

  const markers = useMemo(() => {
    if (!reports) return [];
    return reports
      .map((r) => {
        const lat = typeof r.acf?.lat === "number" ? r.acf.lat : (typeof r.acf?.lat === "string" ? Number(r.acf.lat) : null);
        const lng = typeof r.acf?.lng === "number" ? r.acf.lng : (typeof r.acf?.lng === "string" ? Number(r.acf.lng) : null);
        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;
        return {
          id: r.id,
          lat,
          lng,
          title: r.title ?? (typeof r.raw?.title === "object" ? r.raw.title?.rendered : String(r.raw?.title ?? "")),
          excerpt: typeof r.raw?.excerpt === "object" ? r.raw.excerpt?.rendered : (r.content ?? ""),
          featured_media: r.featured_media ?? null,
          drill_date: r.acf?.drill_date ?? null
        };
      })
      .filter(Boolean) as any[];
  }, [reports]);

  if (!markers.length) {
    return <div className="p-4 text-sm text-gray-600">表示できる位置情報がありません。</div>;
  }

  const center = [markers[0].lat, markers[0].lng] as [number, number];

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup>
            <div>
              <strong>{m.title}</strong>
              <div dangerouslySetInnerHTML={{ __html: m.excerpt ?? "" }} />
              {m.drill_date && <div className="mt-2 text-sm">訓練日: {m.drill_date}</div>}
              {m.featured_media && mediaMap[m.featured_media] && (
                <img src={mediaMap[m.featured_media]} alt="" style={{ maxWidth: "100%", marginTop: 8 }} />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}