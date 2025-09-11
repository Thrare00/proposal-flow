import { lazy, Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { ProposalProvider } from '../contexts/ProposalContext';

// Development tools (only imported when needed)
const AutomationConsole = lazy(() => import('../components/AutomationConsole.jsx'));

// Lazy load all page components with proper error boundaries and loading states
const createLazyComponent = (importFn, fallbackText = 'Loading...') => {
  const LazyComponent = lazy(() => importFn().catch(err => {
    console.error('Failed to load component:', err);
    return { default: () => <div className="p-4 text-red-600">Failed to load component. Please refresh the page.</div> };
  }));
  
  // Return a component instead of an element
  return function LazyWrapper() {
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-gray-600">{fallbackText}</span>
          </div>
        }>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>
    );
  };
};

// Lazy load components with error boundaries
const Layout = createLazyComponent(() => import('../components/Layout.jsx'));
const DashboardFixed = createLazyComponent(() => import('../pages/DashboardFixed.jsx'));
const ProposalDetails = createLazyComponent(() => import('../pages/ProposalDetails.jsx'));
const Calendar = createLazyComponent(() => import('../pages/Calendar.jsx'));
const FlowBoard = createLazyComponent(() => import('../pages/FlowBoard.jsx'));
const Guide = createLazyComponent(() => import('../pages/Guide.jsx'));
const ErrorPage = createLazyComponent(() => import('../pages/Error404.jsx'));
const ProposalForm = createLazyComponent(() => import('../pages/ProposalForm.jsx'));
const MarketResearch = createLazyComponent(() => import('../pages/MarketResearch.jsx'));
const SOWAnalyzer = createLazyComponent(() => import('../pages/SOWAnalyzer.jsx'));
const AIAgentGuide = createLazyComponent(() => import('../pages/AIAgentGuide.jsx'));
const ProposalDevelopmentGuide = createLazyComponent(() => import('../pages/ProposalDevelopmentGuide.jsx'));
const Reminders = createLazyComponent(() => import('../pages/Reminders.jsx'));
const Reports = createLazyComponent(() => import('../pages/Reports.jsx'));
const CadenceSettings = createLazyComponent(() => import('../pages/CadenceSettings.jsx'));
const SystemHealth = createLazyComponent(() => import('../pages/SystemHealth.jsx'));

// Base URL for the application
export const basename = '/proposal-flow';

// No need for RouteWrapper as createLazyComponent already handles error boundaries and suspense

export const routeConfig = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      // Dashboard
      {
        index: true,
        element: <DashboardFixed />,
      },
      {
        path: 'dashboard',
        element: <DashboardFixed />,
      },
      // Flow Board Route
      {
        path: 'flowboard',
        element: withProposalProvider(FlowBoard)(),
      },
      // Reminders Route
      {
        path: 'reminders',
        element: withProposalProvider(Reminders)(),
      },
      // Proposals
      {
        path: 'proposals/new',
        element: <ProposalForm />,
      },
      {
        path: 'proposals/:id',
        element: <ProposalDetails />,
      },
      {
        path: 'proposals/:id/analyze',
        element: <SOWAnalyzer />,
      },
      {
        path: 'proposals/:id/edit',
        element: <ProposalForm />,
      },
      // Market Research
      {
        path: 'market-research',
        element: <MarketResearch />,
      },
      // SOW Analyzer
      {
        path: 'sow-analyzer',
        element: <SOWAnalyzer />,
      },
      // Guides
      {
        path: 'guide',
        element: <Guide />,
      },
      {
        path: 'ai-agent-guide',
        element: <AIAgentGuide />,
      },
      {
        path: 'proposal-development-guide',
        element: <ProposalDevelopmentGuide />,
      },
      // Calendar
      {
        path: 'calendar',
        element: <Calendar />,
      },
      // Reports
      {
        path: 'reports',
        element: <Reports />,
      },
      // Cadence Settings
      {
        path: 'cadence',
        element: <CadenceSettings />,
      },
      // System Health
      {
        path: 'health',
        element: <SystemHealth />,
      },
      // Console route
      {
        path: 'console',
        element: <AutomationConsole />,
      },
      // 404 - Catch all
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
];
