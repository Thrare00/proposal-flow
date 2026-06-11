import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/ui/loading-spinner';

// Lazy load page components
const Layout = lazy(() => import('../components/Layout'));

// Dashboard & Main Views
const Dashboard = lazy(() => import('../pages/DashboardFixed'));
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
const PricingDashboard = lazy(() => import('../pages/PricingDashboard'));

// Settings & Configuration
const CadenceSettings = lazy(() => import('../pages/CadenceSettings'));
const Directories = lazy(() => import('../pages/Directories'));
const SystemHealth = lazy(() => import('../pages/SystemHealth'));
const SettingsTabs = lazy(() => import('../pages/SettingsTabs'));
const CeoActionsTabs = lazy(() => import('../pages/CeoActionsTabs'));
const FlowBoardTabs = lazy(() => import('../pages/FlowBoardTabs'));
const ProposalsTabs = lazy(() => import('../pages/ProposalsTabs'));

// Capture Board (pre-solicitation intelligence)
const CaptureBoardTabs = lazy(() => import('../pages/CaptureBoardTabs'));

// Intake Lanes — score-gated routing view
const IntakeLanes = lazy(() => import('../pages/IntakeLanes'));

// GovCon Inbox
const GovConInbox = lazy(() => import('../pages/GovConInbox'));

// Operator Updates
const OperatorUpdates = lazy(() => import('../pages/OperatorUpdates'));

// Guides & Help
const AIAgentGuide = lazy(() => import('../pages/AIAgentGuide'));
const GettingStarted = lazy(() => import('../pages/GettingStarted'));
const ProposalDevelopmentGuide = lazy(() => import('../pages/ProposalDevelopmentGuide'));
const FederalProposalGuide = lazy(() => import('../pages/FederalProposalGuide'));

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

      // Proposals (tabbed)
      {
        path: 'proposals',
        element: React.createElement(LazyComponent, { component: ProposalsTabs }),
      },
      // Legacy proposal subroutes (avoid 404s on old links)
      { path: 'proposals/new', element: React.createElement(LazyComponent, { component: ProposalForm }) },
      { path: 'proposals/:id', element: React.createElement(LazyComponent, { component: ProposalDetails }) },
      { path: 'proposals/:id/analyze', element: React.createElement(LazyComponent, { component: ProposalDetails }) },
      { path: 'proposals/edit/:id', element: React.createElement(LazyComponent, { component: ProposalForm }) },
      // Legacy proposal routes (kept for back-compat)
      {
        path: 'proposals/legacy',
        children: [
          { index: true, element: React.createElement(LazyComponent, { component: ProposalList }) },
          { path: 'new', element: React.createElement(LazyComponent, { component: ProposalForm }) },
          { path: ':id', element: React.createElement(LazyComponent, { component: ProposalDetails }) },
          { path: 'edit/:id', element: React.createElement(LazyComponent, { component: ProposalForm }) },
        ],
      },

      // Intake Lanes — score-gated routing: Active Pursuit / Review Queue / Watchlist / Award Intel / Archive
      {
        path: 'intake-lanes',
        element: React.createElement(LazyComponent, { component: IntakeLanes }),
      },

      // Capture Board — pre-solicitation intelligence, bid/no-bid, dossier, compliance, knowledge
      {
        path: 'capture',
        element: React.createElement(LazyComponent, { component: CaptureBoardTabs }),
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
        element: React.createElement(LazyComponent, { component: FlowBoardTabs }),
      },
      {
        path: 'pipeline-board',
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
      {
        path: 'pricing',
        element: React.createElement(LazyComponent, { component: PricingDashboard }),
      },

      // GovCon Inbox
      {
        path: 'govcon-inbox',
        element: React.createElement(LazyComponent, { component: GovConInbox }),
      },

      // Operator Updates (hourly cadence)
      {
        path: 'operator-updates',
        element: React.createElement(LazyComponent, { component: OperatorUpdates }),
      },

      // Top-level utility pages
      {
        path: 'directories',
        element: React.createElement(LazyComponent, { component: Directories }),
      },
      {
        path: 'ceo-actions',
        element: React.createElement(LazyComponent, { component: CeoActionsTabs }),
      },

      // Settings & Configuration
      {
        path: 'settings',
        element: React.createElement(LazyComponent, { component: SettingsTabs }),
      },
      // Keep legacy nested settings routes working
      {
        path: 'settings/cadence',
        element: React.createElement(LazyComponent, { component: CadenceSettings }),
      },
      {
        path: 'settings/directories',
        element: React.createElement(LazyComponent, { component: Directories }),
      },
      {
        path: 'settings/system-health',
        element: React.createElement(LazyComponent, { component: SystemHealth }),
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
            path: 'federal-proposal',
            element: React.createElement(LazyComponent, { component: FederalProposalGuide }),
          },
          {
            index: true,
            element: React.createElement(LazyComponent, { component: ProposalDevelopmentGuide }),
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

// Create router with base path derived from Vite base URL
const BASE_PATH = (import.meta.env.BASE_URL || '/proposal-flow/').replace(/\/$/, '');

export const router = createBrowserRouter(routes, {
  basename: BASE_PATH,
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
  },
});

export default router;
