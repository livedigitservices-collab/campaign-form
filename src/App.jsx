import React, { useState } from 'react';
import Home from './pages/Home';
import DailyReviewPage from './pages/DailyReviewPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('campaign'); // 'campaign' | 'review'

  return activeTab === 'campaign' ? (
    <Home activeTab={activeTab} onSelectTab={setActiveTab} />
  ) : (
    <DailyReviewPage activeTab={activeTab} onSelectTab={setActiveTab} />
  );
}
