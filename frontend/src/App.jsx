import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { ForecastExplorer } from './pages/ForecastExplorer';
import { ModelLeaderboard } from './pages/ModelLeaderboard';
import { InventoryAlerts } from './pages/InventoryAlerts';
import { SkuManagement } from './pages/SkuManagement';
import { LoginModal } from './components/LoginModal';
import { RetrainModal } from './components/RetrainModal';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRetrainOpen, setIsRetrainOpen] = useState(false);
  const [lastTrainedResult, setLastTrainedResult] = useState(null);

  const handleTrainingComplete = (result) => {
    setLastTrainedResult(result);
  };

  return (
    <div className="min-h-screen bg-graphite-950 text-paper flex flex-col selection:bg-signal-amber selection:text-graphite-950">
      {/* Top Navbar */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRetrain={() => setIsRetrainOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Application Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'overview' && (
            <ExecutiveOverview
              onNavigate={setActiveTab}
              onOpenRetrain={() => setIsRetrainOpen(true)}
            />
          )}

          {activeTab === 'forecasts' && <ForecastExplorer />}

          {activeTab === 'leaderboard' && (
            <ModelLeaderboard onOpenRetrain={() => setIsRetrainOpen(true)} />
          )}

          {activeTab === 'inventory' && <InventoryAlerts />}

          {activeTab === 'skus' && <SkuManagement />}
        </main>
      </div>

      {/* Global Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RetrainModal
        isOpen={isRetrainOpen}
        onClose={() => setIsRetrainOpen(false)}
        onTrainingComplete={handleTrainingComplete}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
