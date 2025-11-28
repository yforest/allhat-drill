import { useState } from "react";
import apiClient from "../api/client";
import CONFIG from "../config";
import useACFChoices from "../hooks/useACFChoices";

type Props = {
  onSuccess?: () => void;
};

export default function ReportForm({ onSuccess }: Props) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [participantsCount, setParticipantsCount] = useState<string>("");
  const [drillDate, setDrillDate] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [drillTypesSelected, setDrillTypesSelected] = useState<string[]>([]);
  const { choices, loading: choicesLoading, error: choicesError } = useACFChoices("drill_types");

  const FALLBACK_DRILL_TYPES = [
    "シェイクアウト訓練",
    "炊き出し訓練",
    "安否確認訓練",
    "避難誘導訓練",
    "AED・救命講習",
    "その他",
  ];

  const availableDrillTypes = choices && choices.length > 0 ? choices : FALLBACK_DRILL_TYPES;

  function toggleDrillType(value: string) {
    setDrillTypesSelected((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      return [...prev, value];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    console.log("=== フォーム送信開始 ===");
    console.log("入力値:", {
      title,
      content,
      participantsCount,
      drillDate,
      lat,
      lng,
      drillTypesSelected,
      imageFile: imageFile?.name
    });

    try {
      let mediaId: number | undefined = undefined;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile, imageFile.name);
        console.log("画像アップロード開始...");
        const mediaRes = await apiClient.post(CONFIG.ENDPOINTS.MEDIA, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        mediaId = mediaRes?.data?.id;
        console.log("画像アップロード完了。Media ID:", mediaId);
      }

      const acfPayload: any = {
        lat: lat ? lat : null,
        lng: lng ? lng : null,
        drill_date: drillDate ? drillDate : null,
        participants_count: participantsCount ? Number(participantsCount) : null,
        drill_types: drillTypesSelected || [],
      };

      const postPayload: any = {
        title,
        content,
        status: "publish",
        acf: acfPayload,
      };

      if (mediaId) postPayload.featured_media = mediaId;

      console.log("投稿ペイロード（送信直前）:", JSON.stringify(postPayload, null, 2));
      
      const res = await apiClient.post(CONFIG.ENDPOINTS.POSTS, postPayload);
      
      console.log("投稿レスポンス:", res.data);
      console.log("投稿後のACFデータ:", res.data.acf);

      // reset
      setTitle("");
      setContent("");
      setParticipantsCount("");
      setDrillDate("");
      setLat("");
      setLng("");
      setImageFile(null);
      setDrillTypesSelected([]);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("投稿失敗:", err);
      console.error("エラーレスポンス:", err.response?.data);
      alert("投稿に失敗しました。コンソールを確認してください。");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">タイトル</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" required />
      </div>

      <div>
        <label className="block text-sm font-medium">本文</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" rows={4} />
      </div>

      <div>
        <label className="block text-sm font-medium">参加者数</label>
        <input type="number" min={0} value={participantsCount} onChange={e => setParticipantsCount(e.target.value)} className="mt-1 block w-32 border rounded px-2 py-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">訓練日</label>
        <input type="date" value={drillDate} onChange={e => setDrillDate(e.target.value)} className="mt-1 block w-auto border rounded px-2 py-1" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">緯度 (lat)</label>
          <input value={lat} onChange={e => setLat(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" placeholder="例: 35.123456" />
        </div>
        <div>
          <label className="block text-sm font-medium">経度 (lng)</label>
          <input value={lng} onChange={e => setLng(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1" placeholder="例: 135.123456" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">画像 (任意)</label>
        <input type="file" accept="image/*" onChange={e => { const f = e.target.files && e.target.files[0]; setImageFile(f || null); }} className="mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">訓練の種類</label>
        {choicesLoading ? (
          <div>読み込み中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableDrillTypes.map(dt => (
              <label key={dt} className="inline-flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" checked={drillTypesSelected.includes(dt)} onChange={() => toggleDrillType(dt)} />
                <span>{dt}</span>
              </label>
            ))}
          </div>
        )}
        {choicesError && <div className="text-sm text-red-600 mt-1">選択肢の読み込みに一部問題があります（フォールバックを表示）</div>}
      </div>

      <div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          投稿する
        </button>
      </div>
    </form>
  );
}