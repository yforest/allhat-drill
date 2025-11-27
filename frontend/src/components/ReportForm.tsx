import React, { useState } from 'react';

interface Props {
  onCancel?: () => void;
  onSubmitted?: (payload: any) => void;
}

const DRILL_TYPES = ['シェイクアウト', '炊き出し', '避難訓練', '応急救護', '情報伝達'];

const ReportForm: React.FC<Props> = ({ onCancel, onSubmitted }) => {
  const [organization, setOrganization] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const getLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('このブラウザでは位置情報が取得できません');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      (err) => {
        setGeoError(err.message || '位置情報の取得に失敗しました（モックを使用してください）');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      organization,
      participants: participants === '' ? null : Number(participants),
      drill_types: selectedTypes.join(','),
      date,
      location_lat: lat || null,
      location_lng: lng || null,
      photo: fileName || null,
    };

    console.log('Report submit payload:', payload);
    if (onSubmitted) onSubmitted(payload);
    alert('送信（モック）を行いました。コンソールを確認してください。');
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">報告フォーム</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">団体名（任意）</label>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm text-gray-600">参加人数</label>
          <input type="number" value={participants} onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2 border rounded" />
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">訓練種別（複数選択可）</div>
          <div className="flex flex-wrap gap-3">
            {DRILL_TYPES.map((t) => (
              <label key={t} className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">実施日</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 p-2 border rounded" />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm text-gray-600">現在地（緯度/経度）</div>
              <div className="text-sm text-gray-700">{lat && lng ? `${lat}, ${lng}` : '未取得'}</div>
              {geoError && <div className="text-xs text-red-600 mt-1">{geoError}</div>}
            </div>
            <button type="button" onClick={getLocation} className="ml-auto bg-blue-600 text-white px-3 py-1 rounded">
              位置取得
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">写真（任意）</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1" />
          {fileName && <div className="text-xs text-gray-600 mt-1">選択: {fileName}</div>}
        </div>

        <div className="flex gap-3 items-center">
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-4 py-2 rounded">
            {submitting ? '送信中...' : '送信（モック）'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">キャンセル</button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;