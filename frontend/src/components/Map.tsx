import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DrillReport } from '../types/api';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import axios from 'axios';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RecenterMap: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize();
    }, 0);
    return () => clearTimeout(id);
  }, [map]);
  return null;
};

interface Props {
  reports: DrillReport[]; // 動的にマーカー描画
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json';

const Map: React.FC<Props> = ({ reports }) => {
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});

  useEffect(() => {
    setMapReloadKey((k) => k + 1);
  }, [reports]);

  useEffect(() => {
    // featured_media がある報告の media URL を取得する
    const ids = Array.from(new Set(reports.map((r) => (r as any).featured_media).filter(Boolean)));
    if (ids.length === 0) return;

    ids.forEach(async (id) => {
      if (mediaMap[id]) return;
      try {
        const res = await axios.get(`${API_BASE}/wp/v2/media/${id}`);
        const url = res.data?.source_url ?? null;
        if (url) {
          setMediaMap((m) => ({ ...m, [id]: url }));
        }
      } catch (err) {
        // ignore
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  const defaultCenter: [number, number] = [34.697, 135.216];
  const first = reports && reports.length > 0 ? reports[0] : null;
  const center: [number, number] = first && first.acf && first.acf.location_lat && first.acf.location_lng
    ? [Number(first.acf.location_lat), Number(first.acf.location_lng)]
    : defaultCenter;

  const markers = reports
    .map((r) => {
      const lat = r.acf?.location_lat;
      const lng = r.acf?.location_lng;
      if (lat == null || lng == null) return null;
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null;
      return { id: r.id, lat: latNum, lng: lngNum, title: r.title?.rendered ?? '' };
    })
    .filter(Boolean) as { id: number; lat: number; lng: number; title: string }[];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0 relative">
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <div className="text-gray-600">まだ報告がありません</div>
        </div>
      )}
      <MapContainer
        key={mapReloadKey}
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div>
                <div dangerouslySetInnerHTML={{ __html: m.title }} />
                {(reports.find(r => r.id === m.id) as any)?.featured_media && mediaMap[(reports.find(r => r.id === m.id) as any).featured_media] && (
                  <img src={mediaMap[(reports.find(r => r.id === m.id) as any).featured_media]} alt="photo" className="mt-2 w-full max-h-40 object-cover rounded" />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;