import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

const Map: React.FC = () => {
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const position: [number, number] = [34.697, 135.216];

  useEffect(() => {
    setMapReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
      <MapContainer
        key={mapReloadKey}
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap />
        <Marker position={position}>
          <Popup>HAT神戸<br />防災訓練実施ポイント</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;