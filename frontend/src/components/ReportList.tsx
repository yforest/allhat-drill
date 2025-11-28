import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { DrillReport } from '../types/api';

interface Props {
  reports: DrillReport[];
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://hitobou.com/allhat/drill/wpcms/wp-json';

const ReportList: React.FC<Props> = ({ reports }) => {
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const ids = Array.from(new Set(reports.map((r) => (r as any).featured_media).filter(Boolean)));
    if (ids.length === 0) return;

    ids.forEach(async (id) => {
      if (mediaMap[id]) return;
      try {
        const res = await axios.get(`${API_BASE}/wp/v2/media/${id}`);
        const url = res.data?.source_url ?? null;
        if (url) {
          setMediaMap((m) => ({ ...m, [id]: url }));
        }
      } catch (err) {
        // ignore
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  if (!reports || reports.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg p-6 shadow border border-gray-200 text-center">
        現在、報告はありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((r) => {
        const title = r.title ?? (typeof r.raw?.title === 'object' ? r.raw.title?.rendered : String(r.raw?.title ?? ''));
        const excerpt = typeof r.raw?.excerpt === 'object' ? r.raw.excerpt?.rendered : (r.content ?? '');
        const date = r.date ? new Date(r.date) : null;

        return (
          <div key={r.id} className="p-3 border rounded">
            <h3 className="font-bold" dangerouslySetInnerHTML={{ __html: title }} />
            {date && <div className="text-sm text-gray-500">{date.toLocaleString()}</div>}
            <div dangerouslySetInnerHTML={{ __html: excerpt }} />
          </div>
        );
      })}
    </div>
  );
};

export default ReportList;