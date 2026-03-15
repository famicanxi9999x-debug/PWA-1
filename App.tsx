import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './store';
import { Layout } from './components/Layout';
import { AppView } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import {
  DashboardSkeleton,
  TaskListSkeleton,
  ScheduleSkeleton,
  GoalsSkeleton,
} from './components/ui/SkeletonLoaders';

// --- Lazy-loaded route components ---
// Each lazy import creates a separate bundle chunk that is only fetched
// when the user navigates to that view for the first time.
const Dashboard      = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Schedule       = lazy(() => import('./components/Schedule').then(m => ({ default: m.Schedule })));
const FocusHub       = lazy(() => import('./components/FocusHub').then(m => ({ default: m.FocusHub })));
const SecondBrain    = lazy(() => import('./components/SecondBrain').then(m => ({ default: m.SecondBrain })));
const ProjectTracker = lazy(() => import('./components/ProjectTracker').then(m => ({ default: m.ProjectTracker })));
const Review         = lazy(() => import('./components/Review').then(m => ({ default: m.Review })));
const Reports        = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const AuthPage       = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const LandingPage    = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));

// Minimal full-screen fallback for routes that don't have a specific skeleton
const FullPageSpinner: React.FC = () => (
  <div className="w-screen h-screen bg-[#111113] flex items-center justify-center">
    <div className="text-white text-2xl font-bold animate-pulse tracking-widest">FAMEO</div>
  </div>
);

const MainContent = () => {
  const { view } = useApp();

  switch (view) {
    case AppView.DASHBOARD:
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      );
    case AppView.SCHEDULE:
      return (
        <Suspense fallback={<ScheduleSkeleton />}>
          <Schedule />
        </Suspense>
      );
    case AppView.FOCUS:
      return (
        <Suspense fallback={<FullPageSpinner />}>
          <FocusHub />
        </Suspense>
      );
    case AppView.NOTES:
      return (
        <Suspense fallback={<FullPageSpinner />}>
          <SecondBrain />
        </Suspense>
      );
    case AppView.PROJECTS:
      return (
        <Suspense fallback={<TaskListSkeleton />}>
          <ProjectTracker />
        </Suspense>
      );
    case AppView.REVIEW:
      return (
        <Suspense fallback={<GoalsSkeleton />}>
          <Review />
        </Suspense>
      );
    case AppView.REPORTS:
      return (
        <Suspense fallback={<FullPageSpinner />}>
          <Reports />
        </Suspense>
      );
    default:
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      );
  }
};

const AppContent: React.FC = () => {
  const { showLoginPage, isAuthLoading } = useApp();
  const [showLanding, setShowLanding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('flowstate_visited');
    const isMobile = window.innerWidth < 768;
    const urlParams = new URLSearchParams(window.location.search);
    const skipLanding = urlParams.get('skip') === 'true';

    // Show landing only on first desktop visit
    const shouldShowLanding = !hasVisited && !isMobile && !skipLanding;
    setShowLanding(shouldShowLanding);
    setIsLoading(false);
  }, []);

  // Loading state (wait for both internal init and Supabase auth check)
  if (isLoading || isAuthLoading) {
    return <FullPageSpinner />;
  }

  // Show landing page for first-time desktop visitors
  if (showLanding) {
    return (
      <Suspense fallback={<FullPageSpinner />}>
        <LandingPage onEnterApp={() => {
          localStorage.setItem('flowstate_visited', 'true');
          setShowLanding(false);
        }} />
      </Suspense>
    );
  }

  // Show auth/login page if needed
  if (showLoginPage) {
    return (
      <Suspense fallback={<FullPageSpinner />}>
        <AuthPage />
      </Suspense>
    );
  }

  // Show main app
  return (
    <Layout>
      <MainContent />
      <ReloadPrompt />
    </Layout>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ErrorBoundary>
);

export default App;