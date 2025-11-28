import { useState } from "react";
import "./App.css";
import Map from "./components/Map";
import Chart from "./components/Chart";
import StatsCard from "./components/StatsCard";
import ReportList from "./components/ReportList";
import useDataFetch from "./hooks/useDataFetch";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { data, isLoading, error, refetch } = useDataFetch();
  const { user, logout, login, isAuthenticated } = useAuth();
  // currentView / ReportForm / LoginForm は廃止 — 常にダッシュボードを表示する

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

  const displayName = (user as any)?.user_display_name ?? (user as any)?.display_name ?? (user as any)?.user_email ?? "ゲスト";

  // WP 管理画面の投稿・ログアウトURL
  const WP_NEW_POST_URL = "https://hitobou.com/allhat/drill/wpcms/wp-admin/post-new.php";
  const WP_LOGOUT_URL = "https://hitobou.com/allhat/drill/wpcms/wp-login.php?action=logout";
  const WP_LOGIN_URL = "https://hitobou.com/allhat/drill/wpcms/wp-login.php";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ALL HAT 防災ダッシュボード</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                // ダッシュボードに戻る（noop）
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded bg-gray-200"
            >
              ダッシュボード
            </button>

            <button
              onClick={() => {
                // WP の投稿作成画面へ遷移（外部）
                window.location.href = WP_NEW_POST_URL;
              }}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              WP投稿画面へ
            </button>

            <div className="text-sm text-gray-600">{displayName}</div>

            <button
              onClick={() => {
                // AuthContext 側でも logout をリダイレクト処理にしてあるので呼ぶ
                logout();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ログアウト (WP)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 強めの CTA を WP 投稿画面へ誘導 */}
        <div className="mb-6">
          <a href={WP_NEW_POST_URL} target="_blank" rel="noreferrer" className="block">
            <div className="cursor-pointer bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-lg p-6 shadow-md hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">新規報告を行う（WPへ）</h3>
                  <p className="mt-1 text-sm opacity-90">
                    投稿は WordPress 管理画面から行ってください。写真や位置情報の保存は WP 上で行われます。
                  </p>
                </div>
                <div className="text-4xl opacity-90">＋</div>
              </div>
            </div>
          </a>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatsCard title="総参加者数" value={totalParticipants} />
          <StatsCard title="訓練実施回数" value={totalDrills} />
        </div>

        {/* チャートとマップ */}
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
      </main>
    </div>
  );
}