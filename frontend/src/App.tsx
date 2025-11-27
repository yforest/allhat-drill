import React from 'react';
import Map from './components/Map';
import Chart from './components/Chart';
import StatsCard from './components/StatsCard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-semibold">ALL HAT 防災ダッシュボード</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-6 pb-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="参加者数" value="1,234" subtitle="累計参加者" />
          <StatsCard title="訓練回数" value="12" subtitle="今年" />
          <StatsCard title="達成率" value="87%" subtitle="目標達成率" />
        </section>

        <section>
          <Chart />
        </section>

        <section>
          <Map />
        </section>
      </main>
    </div>
  );
};

export default App;