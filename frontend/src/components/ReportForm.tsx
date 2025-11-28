import React, { useState } from 'react';
import apiClient from '../api/client';
import { CONFIG } from '../config';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  onSuccess?: () => void;
};

export default function ReportForm({ onSuccess }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [types, setTypes] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (file: File): Promise<number> => {
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
    const form = new FormData();
    form.append('file', compressed, compressed.name || file.name);
    const headers: Record<string, string> = { 'Content-Disposition': `attachment; filename="${file.name}"` };
    // apiClient の interceptor が Authorization を付与するためここでは不要
    const res = await apiClient.post(CONFIG.ENDPOINTS.MEDIA, form, { headers });
    return res.data.id as number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let featured_media = 0;
      if (files && files.length > 0) {
        featured_media = await uploadMedia(files[0]);
      }

      const acfPayload = {
        participants_count: participants === '' ? null : Number(participants),
        drill_types: types || null,
        location_lat: lat === '' ? null : Number(lat),
        location_lng: lng === '' ? null : Number(lng),
      };

      const postPayload: any = {
        title,
        content,
        status: 'publish',
        acf: acfPayload,
      };
      if (featured_media) postPayload.featured_media = featured_media;

      await apiClient.post(CONFIG.ENDPOINTS.POSTS, postPayload);

      // リセット
      setTitle('');
      setContent('');
      setParticipants('');
      setTypes('');
      setLat('');
      setLng('');
      setFiles(null);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</div>}

      {/* セクション 1: 報告情報 */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">報告情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">内容</label>
            <textarea
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </section>

      {/* セクション 2: 訓練詳細 */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">訓練詳細</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">参加者数</label>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={participants}
              onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">訓練種別（カンマ区切り）</label>
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={types}
              onChange={(e) => setTypes(e.target.value)}
              placeholder="例: シェイクアウト,炊き出し"
            />
          </div>
        </div>
      </section>

      {/* セクション 3: 位置情報と写真 */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">位置情報と写真</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">緯度 (location_lat)</label>
            <input
              type="number"
              step="any"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={lat}
              onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="例: 34.697"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">経度 (location_lng)</label>
            <input
              type="number"
              step="any"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={lng}
              onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="例: 135.216"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">画像（任意）</label>
            <input
              type="file"
              accept="image/*"
              className="w-full"
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '送信中...' : '投稿する'}
        </button>
        <button
          type="button"
          onClick={() => {
            // 簡易リセット
            setTitle('');
            setContent('');
            setParticipants('');
            setTypes('');
            setLat('');
            setLng('');
            setFiles(null);
          }}
          className="px-4 py-2 bg-gray-100 rounded"
        >
          リセット
        </button>
      </div>
    </form>
  );
}