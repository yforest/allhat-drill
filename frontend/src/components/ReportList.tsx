import { useMemo, useState, useEffect } from "react";
import apiClient from "../api/client";
import type { DrillReport } from "../types/api";

function getAuthorName(raw: any): string {
  if (!raw) return "不明";
  if (typeof raw.author_name === "string" && raw.author_name) return raw.author_name;
  if (raw._embedded && Array.isArray(raw._embedded.author) && raw._embedded.author[0]?.name)
    return raw._embedded.author[0].name;
  if (typeof raw.author === "object" && raw.author?.name) return raw.author.name;
  if (typeof raw.author === "string" && raw.author) return raw.author;
  if (typeof raw.author === "number") return String(raw.author);
  return "不明";
}

export default function ReportList({ reports }: { reports: DrillReport[] | null }) {
  const perPage = 1; // 1件だけ表示
  const [page, setPage] = useState<number>(1);
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});

  const total = reports ? reports.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pageItems = useMemo(() => {
    if (!reports) return [];
    return reports.slice((page - 1) * perPage, page * perPage);
  }, [reports, page]);

  // 表示中の投稿の画像（featured_media）を取得してキャッシュ
  useEffect(() => {
    let mounted = true;
    async function fetchMedia() {
      const toFetch = pageItems
        .map((r) => r.featured_media)
        .filter((id): id is number => typeof id === "number" && id > 0 && !mediaMap[id]);

      if (toFetch.length === 0) return;

      const results: Record<number, string> = {};
      await Promise.all(
        toFetch.map(async (id) => {
          try {
            const res = await apiClient.get(`/wp/v2/media/${id}`);
            if (!mounted) return;
            const url = res?.data?.source_url;
            if (url) results[id] = url;
          } catch {
            // ignore failures per-item
          }
        })
      );

      if (!mounted) return;
      setMediaMap((m) => ({ ...m, ...results }));
    }

    fetchMedia();
    return () => {
      mounted = false;
    };
  }, [pageItems]); // eslint-disable-line

  if (!reports || reports.length === 0) {
    return <div className="text-sm text-gray-600">表示できる投稿がありません。</div>;
  }

  return (
    <div>
      <div className="space-y-6">
        {pageItems.map((r) => {
          const title = r.title ?? (typeof r.raw?.title === "object" ? r.raw.title?.rendered : String(r.raw?.title ?? ""));
          const author = getAuthorName(r.raw);
          const drillDate = r.acf?.drill_date ?? null;
          const drillTypes = Array.isArray(r.acf?.drill_types) ? r.acf!.drill_types : (r.acf?.drill_types ? [r.acf.drill_types] : []);
          const imageUrl = r.featured_media ? mediaMap[r.featured_media] : null;

          return (
            <article key={r.id} className="p-4 border rounded-md">
              <div className="grid grid-cols-3 gap-4">
                {/* 左: コンテンツ（2/3） */}
                <div className="col-span-2">
                  <header className="mb-2">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="text-sm text-gray-500">
                      投稿者: <span className="font-medium text-gray-700">{author}</span>
                      {drillDate && (
                        <>
                          {" ・ "}
                          訓練日時:{" "}
                          <time className="font-medium text-gray-700">
                            {(() => {
                              try {
                                const d = new Date(drillDate as string);
                                return isNaN(d.getTime()) ? String(drillDate) : d.toLocaleString();
                              } catch {
                                return String(drillDate);
                              }
                            })()}
                          </time>
                        </>
                      )}
                    </div>
                  </header>

                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {drillTypes && drillTypes.length > 0 ? (
                        drillTypes.map((dt: string) => (
                          <span key={dt} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            {dt}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">訓練種類: 未設定</span>
                      )}
                    </div>
                  </div>

                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: r.content ?? (typeof r.raw?.content === "object" ? r.raw.content?.rendered ?? "" : String(r.raw?.content ?? "")) }} />
                </div>

                {/* 右: 画像（1/3） */}
                <div className="col-span-1 flex items-start">
                  {imageUrl ? (
                    <img src={imageUrl} alt={title ?? "投稿画像"} className="w-full h-40 object-cover rounded-md" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center text-sm text-gray-400">
                      画像なし
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* pagination：中央に配置 */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-3 py-1 rounded ${page <= 1 ? "bg-gray-100 text-gray-400" : "bg-white border"}`}
          >
            前へ
          </button>

          <div className="text-sm">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`mx-1 px-2 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-white border"}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded ${page >= totalPages ? "bg-gray-100 text-gray-400" : "bg-white border"}`}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}