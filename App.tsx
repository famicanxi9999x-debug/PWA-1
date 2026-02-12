import React from 'react';
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
import { AppView } from './types';

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

    if (showLoginPage) {
        return <AuthPage />;
    }

    return (
        <Layout>
            <MainContent />
        </Layout>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;