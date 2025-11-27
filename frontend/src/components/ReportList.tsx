import React from 'react';
import type { DrillReport } from '../types/api';

interface Props {
  reports: DrillReport[];
}

const ReportList: React.FC<Props> = ({ reports }) => {
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
        const acf = r.acf ?? {};
        const participants = acf.participants_count ?? '不明';
        const org = (acf as any).organization ?? '';
        const typesRaw = (acf.drill_types ?? '').toString();
        const types = typesRaw ? typesRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

        return (
          <div key={r.id} className="bg-white rounded-lg p-4 shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold" dangerouslySetInnerHTML={{ __html: r.title?.rendered ?? '無題' }} />
                <div className="text-xs text-gray-500 mt-1">実施日: {new Date(r.date).toLocaleString()}</div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>参加: <span className="font-medium">{participants}</span></div>
                {org && <div>団体: <span className="font-medium">{org}</span></div>}
              </div>
            </div>

            {types.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500">訓練種別:</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {types.map((t) => (
                    <span key={t} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {r.content?.rendered && (
              <div className="mt-3 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: (r.content.rendered || '').slice(0, 300) + ((r.content.rendered || '').length > 300 ? '...' : '') }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReportList;