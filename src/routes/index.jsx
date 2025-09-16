import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/ui/loading-spinner';

// Lazy load page components
const Layout = lazy(() => import('../components/Layout'));

// Dashboard & Main Views
const Dashboard = lazy(() => import('../pages/DashboardFixed'));
const DashboardOld = lazy(() => import('../pages/Dashboard'));
const Home = lazy(() => import('../pages/Home'));
const LandingPage = lazy(() => import('../pages/LandingPage'));

// Proposal Related
const ProposalDetails = lazy(() => import('../pages/ProposalDetails'));
const ProposalForm = lazy(() => import('../pages/ProposalForm'));
const ProposalList = lazy(() => import('../pages/ProposalList'));

// Tools & Features
const Calendar = lazy(() => import('../pages/Calendar'));
const Reminders = lazy(() => import('../pages/Reminders'));
const FlowBoard = lazy(() => import('../pages/FlowBoard'));
const Reports = lazy(() => import('../pages/Reports'));
const SOWAnalyzer = lazy(() => import('../pages/SOWAnalyzer'));
const MarketResearch = lazy(() => import('../pages/MarketResearch'));

// Settings & Configuration
const CadenceSettings = lazy(() => import('../pages/CadenceSettings'));
const Directories = lazy(() => import('../pages/Directories'));
const SystemHealth = lazy(() => import('../pages/SystemHealth'));

// Guides & Help
const AIAgentGuide = lazy(() => import('../pages/AIAgentGuide'));
const Guide = lazy(() => import('../pages/Guide'));
const GettingStarted = lazy(() => import('../pages/GettingStarted'));
const ProposalDevelopmentGuide = lazy(() => import('../pages/ProposalDevelopmentGuide'));

// Testing & Debug
const TestPage = lazy(() => import('../pages/TestPage'));
const SimpleTest = lazy(() => import('../pages/SimpleTest'));

// Error Pages
const Error404 = lazy(() => import('../pages/Error404'));

// Loading component
const Loading = () => {
  return React.createElement('div', { className: 'flex items-center justify-center min-h-screen' },
    React.createElement(LoadingSpinner, { size: 'lg' })
  );
};

// Wrapper component for lazy loading
const LazyComponent = ({ component: Component }) => {
  return React.createElement(
    Suspense,
    { fallback: React.createElement(Loading) },
    React.createElement(Component)
  );
};

const routes = [
  {
    path: '/',
    element: React.createElement(LazyComponent, { component: Layout }),
    errorElement: React.createElement(LazyComponent, { component: Error404 }),
    children: [
      // Default route - redirects to dashboard
      {
        index: true,
        element: React.createElement(Navigate, { to: 'dashboard', replace: true }),
      },
      
      // Main Dashboard & Home
      {
        path: 'dashboard',
        element: React.createElement(LazyComponent, { component: Dashboard }),
      },
      {
        path: 'home',
        element: React.createElement(LazyComponent, { component: Home }),
      },
      {
        path: 'landing',
        element: React.createElement(LazyComponent, { component: LandingPage }),
      },

      // Proposal Management
      {
        path: 'proposals',
        children: [
          {
            index: true,
            element: React.createElement(LazyComponent, { component: ProposalList }),
          },
          {
            path: 'new',
            element: React.createElement(LazyComponent, { component: ProposalForm }),
          },
          {
            path: ':id',
            element: React.createElement(LazyComponent, { component: ProposalDetails }),
          },
          {
            path: 'edit/:id',
            element: React.createElement(LazyComponent, { component: ProposalForm }),
          },
        ],
      },

      // Tools & Features
      {
        path: 'calendar',
        element: React.createElement(LazyComponent, { component: Calendar }),
      },
      {
        path: 'reminders',
        element: React.createElement(LazyComponent, { component: Reminders }),
      },
      {
        path: 'flowboard',
        element: React.createElement(LazyComponent, { component: FlowBoard }),
      },
      {
        path: 'reports',
        element: React.createElement(LazyComponent, { component: Reports }),
      },
      {
        path: 'sow-analyzer',
        element: React.createElement(LazyComponent, { component: SOWAnalyzer }),
      },
      {
        path: 'market-research',
        element: React.createElement(LazyComponent, { component: MarketResearch }),
      },

      // Settings & Configuration
      {
        path: 'settings',
        children: [
          {
            path: 'cadence',
            element: React.createElement(LazyComponent, { component: CadenceSettings }),
          },
          {
            path: 'directories',
            element: React.createElement(LazyComponent, { component: Directories }),
          },
          {
            path: 'system-health',
            element: React.createElement(LazyComponent, { component: SystemHealth }),
          },
        ],
      },

      // Guides & Help
      {
        path: 'guides',
        children: [
          {
            path: 'ai-agent',
            element: React.createElement(LazyComponent, { component: AIAgentGuide }),
          },
          {
            path: 'getting-started',
            element: React.createElement(LazyComponent, { component: GettingStarted }),
          },
          {
            path: 'proposal-development',
            element: React.createElement(LazyComponent, { component: ProposalDevelopmentGuide }),
          },
          {
            index: true,
            element: React.createElement(LazyComponent, { component: Guide }),
          },
        ],
      },

      // Testing & Debug
      {
        path: 'test',
        children: [
          {
            index: true,
            element: React.createElement(LazyComponent, { component: TestPage }),
          },
          {
            path: 'simple',
            element: React.createElement(LazyComponent, { component: SimpleTest }),
          },
          {
            path: 'dashboard-old',
            element: React.createElement(LazyComponent, { component: DashboardOld }),
          },
        ],
      },

      // 404 - Must be last
      {
        path: '*',
        element: React.createElement(LazyComponent, { component: Error404 }),
      },
    ],
  },
];

// Create router with base path
const BASE_PATH = '/proposal-flow';

export const router = createBrowserRouter(routes, {
  basename: BASE_PATH,
  future: {
    v7_relativeSplatPath: true,
  },
});

export default router;
