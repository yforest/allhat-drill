import { useState } from 'react';
import './App.css';
import Map from './components/Map';
import Chart from './components/Chart';
import StatsCard from './components/StatsCard';
import ReportList from './components/ReportList';
import ReportForm from './components/ReportForm';
import LoginForm from './components/LoginForm';
import { useDataFetch } from './hooks/useDataFetch';
import { useAuth } from './contexts/AuthContext';

type View = 'dashboard' | 'report';

function App() {
  const { data, isLoading, error, refetch } = useDataFetch();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">エラー: {error.message}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    );
  }

  const reports = data?.reports || [];
  const totalParticipants = data?.totalParticipants || 0;
  const totalDrills = data?.totalDrills || 0;
  const chartData = data?.chartData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            ALL HAT 防災ダッシュボード
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              ダッシュボード
            </button>
            <button
              onClick={() => setCurrentView('report')}
              className={`px-4 py-2 rounded ${
                currentView === 'report'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              報告投稿
            </button>
            <div className="text-sm text-gray-600">
              {user.user_display_name || user.user_email}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {currentView === 'dashboard' ? (
          <>
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatsCard title="総参加者数" value={totalParticipants} />
              <StatsCard title="訓練実施回数" value={totalDrills} />
            </div>

            {/* 新規報告アクション（目立つカード形式） */}
            <div className="mb-6">
              <div
                role="button"
                onClick={() => setCurrentView('report')}
                className="cursor-pointer bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-lg p-6 shadow-md hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">新規報告を行う</h3>
                    <p className="mt-1 text-sm opacity-90">
                      訓練の実施報告を簡単操作で送信できます。写真や位置情報も添付可能です。
                    </p>
                  </div>
                  <div className="text-4xl opacity-90">＋</div>
                </div>
              </div>
            </div>

            {/* グリッドレイアウト：チャートとマップ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow min-h-64">
                <h2 className="text-xl font-semibold mb-4">訓練種別分布</h2>
                <Chart data={chartData} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">実施地域マップ</h2>
                <Map reports={reports} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">最近の報告</h2>
              <ReportList reports={reports} />
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">訓練報告を投稿</h2>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-3 py-1 text-sm bg-gray-200 rounded"
              >
                戻る
              </button>
            </div>
            <ReportForm
              onSuccess={() => {
                void refetch();
                setCurrentView('dashboard');
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;