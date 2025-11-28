import "./App.css";
import Map from "./components/Map";
import Chart from "./components/Chart";
import StatsCard from "./components/StatsCard";
import ReportList from "./components/ReportList";
import useDataFetch from "./hooks/useDataFetch";

export default function App() {
  const { data, isLoading, error } = useDataFetch();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    const errMsg = (error && (error.message || String(error))) || "不明なエラー";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">エラー: {errMsg}</div>
      </div>
    );
  }

  const reports = data?.reports ?? [];
  const totalParticipants = data?.totalParticipants ?? 0;
  const totalDrills = data?.totalDrills ?? 0;
  const chartData = data?.chartData ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">ALL HAT 防災訓練報告サイト</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* 最新の報告 */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">最近の報告</h2>
          <ReportList reports={reports} />
        </section>

        {/* 訓練種別分布 */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">訓練種別分布</h2>
          <div className="w-full" style={{ minHeight: 220 }}>
            <Chart data={chartData} />
          </div>
        </section>

        {/* 地図 */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">実施地域マップ</h2>
          <div style={{ height: 480 }}>
            <Map reports={reports} />
          </div>
        </section>

        {/* 統計カード（オプション） */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsCard title="総参加者数" value={totalParticipants} />
          <StatsCard title="訓練実施回数" value={totalDrills} />
        </section>
      </main>
    </div>
  );
}