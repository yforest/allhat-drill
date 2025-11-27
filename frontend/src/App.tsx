import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from 'react'; // useStateをインポート

// Leafletのデフォルトアイコン設定（Vite環境でのバグ修正）
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// 地図のサイズを強制的に再計算するコンポーネント
const RecenterMap = () => {
    const map = useMap();
    useEffect(() => {
        // マップが描画された後、ブラウザの描画タイミングに合わせてサイズを再計算させる
        const timeoutId = setTimeout(() => {
            map.invalidateSize();
        }, 0); // ゼロディレイで次のイベントループに処理を渡す
        
        return () => clearTimeout(timeoutId);
    }, [map]);
    return null; 
};

const Map = () => {
  // マップの再初期化を強制するためのキー
  const [mapReloadKey, setMapReloadKey] = useState(0);

  // HAT神戸周辺の座標 (緯度, 経度)
  const position: [number, number] = [34.697, 135.216];

  // コンポーネントがマウントされた後に一度だけキーを更新し、地図の再描画を誘発
  useEffect(() => {
    // 開発中の問題を解決するため、初回描画後にキーを更新
    setMapReloadKey(prev => prev + 1);
  }, []); 

  return (
    // Tailwindのheightクラス h-96 (384px) を指定
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
      <MapContainer 
        key={mapReloadKey} // キーを付与して再初期化を強制
        center={position} 
        zoom={14} 
        scrollWheelZoom={false} 
        // MapContainer自体にも明示的に高さを指定
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 再計算コンポーネントをMapContainer内に配置 */}
        <RecenterMap /> 
        <Marker position={position}>
          <Popup>
            HAT神戸<br />防災訓練実施ポイント
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;