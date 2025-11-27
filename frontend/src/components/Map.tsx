import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import type { DrillReport } from '../types/api';
import 'leaflet/dist/leaflet.css';

const DEFAULT_API_URL = 'https://hitobou.com/allhat/drill/wpcms/wp-json/wp/v2/posts';
const API_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_URL;
const API_BASE = API_URL.replace(/\/wp\/v2\/posts\/?$/, '') || (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json';

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

type Props = {
  reports: DrillReport[];
};

export default function AppMap({ reports }: Props) {
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});
  const markers = useMemo(() => {
    const parseNum = (v: any) => {
      if (v == null || v === '') return null;
      const n = Number(String(v).replace(/[^\d.\-]/g, ''));
      return Number.isNaN(n) ? null : n;
    };
    return reports
      .map((post) => {
        const acf = post.acf ?? {};
        const lat = parseNum(acf.lat ?? acf.location_lat ?? acf.latitude);
        const lng = parseNum(acf.lng ?? acf.location_lng ?? acf.longitude);
        if (lat == null || lng == null) return null;
        return {
          id: post.id,
          lat,
          lng,
          title: post.title?.rendered ?? '',
          excerpt: post.excerpt?.rendered ?? post.content?.rendered ?? '',
          featured_media: (post as any).featured_media ?? 0,
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
    // featured_media をまとめて取得
    const ids = Array.from(new Set(markers.map((m) => m.featured_media).filter(Boolean)));
    if (ids.length === 0) return;
    ids.forEach((id) => {
      if (mediaMap[id]) return;
      void axios.get(`${API_BASE}/wp/v2/media/${id}`).then((res) => {
        const src = res.data?.source_url;
        setMediaMap((s) => ({ ...s, [id]: src }));
      }).catch(() => {
        setMediaMap((s) => ({ ...s, [id]: '' }));
      });
    });
  }, [markers, API_BASE, mediaMap]);

  const defaultCenter: [number, number] = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [34.697, 135.216];

  return (
    <div className="h-96 w-full">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={defaultCenter} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: m.title }} />
                {m.featured_media && mediaMap[m.featured_media] ? (
                  <img src={mediaMap[m.featured_media]} alt="" className="w-full mt-2" />
                ) : null}
                <div className="mt-2" dangerouslySetInnerHTML={{ __html: m.excerpt }} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}