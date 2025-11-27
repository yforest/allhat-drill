import React, { useState } from 'react';
import Map from './components/Map';
import Chart from './components/Chart';
import StatsCard from './components/StatsCard';
import ReportList from './components/ReportList';
import ReportForm from './components/ReportForm';
import LoginForm from './components/LoginForm';
import { useDataFetch } from './hooks/useDataFetch';
import { useAuth } from './contexts/AuthContext';

type View = 'dashboard' | 'report';

const App: React.FC = () => {
  const { data, isLoading, error } = useDataFetch();
  const { isAuthenticated, isAuthReady, logout } = useAuth();

  const [view, setView] = useState<View>('dashboard');

  // 認証初期化待ち（localStorage の読み込みが完了するまで待つ）
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">認証情報を初期化しています...</div>
      </div>
    );
  }

  // 未認証なら LoginForm を表示（確実にダッシュボードを隠す）
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // 認証済みユーザー向けダッシュボード
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">データ取得中にエラーが発生しました: {error.message}</div>
      </div>
    );
  }

  const reports = data?.reports ?? [];
  const totalParticipants = data?.totalParticipants ?? 0;
  const totalDrills = data?.totalDrills ?? 0;
  const chartData = data?.chartData ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">ALL HAT 防災ダッシュボード</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="px-3 py-1 rounded bg-gray-100">ダッシュボード</button>
            <button onClick={() => setView('report')} className="px-3 py-1 rounded bg-blue-600 text-white">報告する</button>
            <button onClick={() => { logout(); }} className="px-3 py-1 rounded border">ログアウト</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-6 pb-8 pt-6">
        {view === 'dashboard' ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard title="参加者数" value={totalParticipants} subtitle="累計参加者" />
              <StatsCard title="訓練回数" value={totalDrills} subtitle="取得済み投稿数" />
              <StatsCard title="訓練種別数" value={chartData.length} subtitle="分類数" />
            </section>

            <section>
              <Chart chartData={chartData} />
            </section>

            <section>
              <Map reports={reports} />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">最新の報告一覧</h2>
              <ReportList reports={reports} />
            </section>
          </>
        ) : (
          <section>
            <ReportForm onCancel={() => setView('dashboard')} onSubmitted={() => setView('dashboard')} />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;