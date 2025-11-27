import React, { useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_API_URL = 'https://hitobou.com/allhat/drill/wpcms/wp-json/wp/v2/posts';
const API_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_URL;
const API_BASE = API_URL.replace(/\/wp\/v2\/posts\/?$/, '') || (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json';

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

  const uploadMedia = async (file: File) => {
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
    const form = new FormData();
    form.append('file', compressed, compressed.name || file.name);
    const headers: any = { 'Content-Disposition': `attachment; filename="${file.name}"` };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await axios.post(`${API_BASE}/wp/v2/media`, form, { headers });
    return res.data.id as number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let featured_media = 0;
      if (files && files.length > 0) {
        // upload first file and set as featured
        featured_media = await uploadMedia(files[0]);
      }

      const acfPayload: Record<string, any> = {
        participants_count: participants === '' ? null : Number(participants),
        drill_types: types || null,
        lat: lat === '' ? null : Number(lat),
        lng: lng === '' ? null : Number(lng),
      };

      const postPayload: any = {
        title,
        content,
        status: 'publish',
        acf: acfPayload,
      };
      if (featured_media) postPayload.featured_media = featured_media;

      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      await axios.post(`${API_BASE}/wp/v2/posts`, postPayload, { headers });

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium">タイトル</label>
        <input className="mt-1 block w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">内容</label>
        <textarea className="mt-1 block w-full" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">参加者数</label>
          <input type="number" className="mt-1 block w-full" value={participants} onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">訓練種別（カンマ区切り）</label>
          <input className="mt-1 block w-full" value={types} onChange={(e) => setTypes(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">緯度 (lat)</label>
          <input className="mt-1 block w-full" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">経度 (lng)</label>
          <input className="mt-1 block w-full" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">画像（任意）</label>
        <input type="file" accept="image/*" onChange={(e) => setFiles(e.target.files)} />
      </div>
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit" disabled={loading}>
          {loading ? '送信中...' : '投稿する'}
        </button>
      </div>
    </form>
  );
}