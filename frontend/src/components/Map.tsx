import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DrillReport } from '../types/api';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

const Map: React.FC<Props> = ({ reports }) => {
  const [mapReloadKey, setMapReloadKey] = useState(0);

  useEffect(() => {
    setMapReloadKey((k) => k + 1);
  }, [reports]);

  // 中心座標: 最初の報告の座標があればそれを使う、なければ HAT神戸のデフォルト
  const defaultCenter: [number, number] = [34.697, 135.216];
  const first = reports && reports.length > 0 ? reports[0] : null;
  const center: [number, number] = first && first.acf && first.acf.location_lat && first.acf.location_lng
    ? [Number(first.acf.location_lat), Number(first.acf.location_lng)]
    : defaultCenter;

  // マーカー配列を作成
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
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
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
            <Popup dangerouslySetInnerHTML={{ __html: m.title }} />
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;