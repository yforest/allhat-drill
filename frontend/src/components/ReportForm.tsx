import React, { useState } from 'react';
import apiClient from '../api/client';
import { CONFIG } from '../config';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../contexts/AuthContext';

type Props = { onSuccess?: () => void };

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

      setTitle(''); setContent(''); setParticipants(''); setTypes(''); setLat(''); setLng(''); setFiles(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && <div className="text-red-600">{error}</div>}
      <div><label>タイトル</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div><label>内容</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} /></div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="参加者数" value={participants} onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))} />
        <input placeholder="訓練種別" value={types} onChange={(e) => setTypes(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="緯度" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} />
        <input placeholder="経度" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))} />
      </div>
      <div><input type="file" accept="image/*" onChange={(e) => setFiles(e.target.files)} /></div>
      <button type="submit" disabled={loading}>{loading ? '送信中...' : '投稿する'}</button>
    </form>
  );
}