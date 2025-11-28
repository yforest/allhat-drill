import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../api/client';
import { CONFIG } from '../config';
import type { DrillReport } from '../types/api';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: (import.meta.env.BASE_URL || '/') + 'marker-icon-2x.png',
  iconUrl: (import.meta.env.BASE_URL || '/') + 'marker-icon.png',
  shadowUrl: (import.meta.env.BASE_URL || '/') + 'marker-shadow.png',
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    setTimeout(() => {
      map.invalidateSize();
      map.setView(center);
    }, 0);
  }, [map, center]);
  return null;
}

type Props = { reports: DrillReport[] };

function parseNumber(value: any): number | null {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

export default function AppMap({ reports }: Props) {
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});

  const markers = useMemo(() => {
    return reports
      .map((post) => {
        const acf = post.acf ?? {};
        const lat = parseNumber(acf.location_lat ?? acf.lat ?? acf.latitude);
        const lng = parseNumber(acf.location_lng ?? acf.lng ?? acf.longitude);
        if (lat == null || lng == null) return null;
        return {
          id: post.id,
          lat,
          lng,
          title: post.title?.rendered ?? '',
          excerpt: post.excerpt?.rendered ?? post.content?.rendered ?? '',
          featured_media: post.featured_media ?? 0,
        };
      })
      .filter(Boolean) as {
        id: number;
        lat: number;
        lng: number;
        title: string;
        excerpt: string;
        featured_media: number;
      }[];
  }, [reports]);

  useEffect(() => {
    const ids = Array.from(new Set(markers.map((m) => m.featured_media).filter(Boolean)));
    if (ids.length === 0) return;
    ids.forEach((id) => {
      if (mediaMap[id] !== undefined) return;
      void apiClient
        .get(`${CONFIG.ENDPOINTS.MEDIA}/${id}`)
        .then((res) => {
          const src = res.data?.source_url || '';
          setMediaMap((prev) => ({ ...prev, [id]: src }));
        })
        .catch(() => {
          setMediaMap((prev) => ({ ...prev, [id]: '' }));
        });
    });
  }, [markers, mediaMap]);

  if (markers.length === 0) {
    return <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded">まだ報告がありません</div>;
  }

  const center: [number, number] = [markers[0].lat, markers[0].lng];

  return (
    <div className="h-96 w-full">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        <RecenterMap center={center} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: m.title }} />
                {m.featured_media && mediaMap[m.featured_media] ? (
                  <img src={mediaMap[m.featured_media]} className="w-full mt-2 rounded" alt="" />
                ) : null}
                <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: m.excerpt }} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}