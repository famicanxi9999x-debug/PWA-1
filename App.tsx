import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FocusHub } from './components/FocusHub';
import { SecondBrain } from './components/SecondBrain';
import { ProjectTracker } from './components/ProjectTracker';
import { Review } from './components/Review';
import { Schedule } from './components/Schedule';
import { AuthPage } from './components/AuthPage';
import { Reports } from './components/Reports';
import { LandingPage } from './components/LandingPage';
import { AppView } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReloadPrompt } from './components/ui/ReloadPrompt';

const MainContent = () => {
  const { view } = useApp();

  switch (view) {
    case AppView.DASHBOARD:
      return <Dashboard />;
    case AppView.SCHEDULE:
      return <Schedule />;
    case AppView.FOCUS:
      return <FocusHub />;
    case AppView.NOTES:
      return <SecondBrain />;
    case AppView.PROJECTS:
      return <ProjectTracker />;
    case AppView.REVIEW:
      return <Review />;
    case AppView.REPORTS:
      return <Reports />;
    default:
      return <Dashboard />;
  }
};

const AppContent: React.FC = () => {
  const { showLoginPage } = useApp();
  const [showLanding, setShowLanding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Smart Detection Logic
    const hasVisited = localStorage.getItem('flowstate_visited');
    const isMobile = window.innerWidth < 768;
    const urlParams = new URLSearchParams(window.location.search);
    const skipLanding = urlParams.get('skip') === 'true';

    // Decision logic:
    // - Skip landing if: already visited OR mobile OR skip param
    // - Show landing if: first visit AND desktop AND no skip param
    const shouldShowLanding = !hasVisited && !isMobile && !skipLanding;

    setShowLanding(shouldShowLanding);
    setIsLoading(false);
  }, []);

  const handleEnterApp = () => {
    // Mark as visited
    localStorage.setItem('flowstate_visited', 'true');
    setShowLanding(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">
          Fameo
        </div>
      </div>
    );
  }

  // Show landing page for first-time desktop visitors
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  // Show auth/login page if needed
  if (showLoginPage) {
    return <AuthPage />;
  }

  // Show main app
  return (
    <Layout>
      <MainContent />
      <ReloadPrompt />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;