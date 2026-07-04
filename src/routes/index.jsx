import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/ui/loading-spinner';

// Shared with src/main.jsx's top-level ErrorBoundary — same key/regex so only ONE
// auto-reload is ever attempted per session, no matter which boundary catches the error.
const CHUNK_ERROR_REGEX = /Loading chunk|dynamically imported module|Failed to fetch/i;
const CHUNK_RELOAD_KEY = 'pf_chunk_reload_attempted';

function isChunkLoadError(error) {
  return CHUNK_ERROR_REGEX.test(error?.message || '');
}

function hasAlreadyAttemptedReload() {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
  } catch {
    return false;
  }
}

function markReloadAttempted() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall through to fallback UI
  }
}

// Route-level error boundary: catches lazy/chunk-load failures for a single route
// so one stale/missing chunk doesn't take down the whole app shell. On a recognized
// chunk-load error it reloads the page ONCE (session-guarded); otherwise it renders
// a small branded fallback.
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[route] Error caught by RouteErrorBoundary:', error, errorInfo);

    if (isChunkLoadError(error) && !hasAlreadyAttemptedReload()) {
      markReloadAttempted();
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        { className: 'flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4' },
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-gray-800' },
          'Something went wrong'
        ),
        React.createElement(
          'p',
          { className: 'text-gray-500 max-w-sm' },
          isChunkLoadError(this.state.error)
            ? 'A newer version of Proposal Flow may be available.'
            : 'This page failed to load.'
        ),
        React.createElement(
          'button',
          {
            onClick: () => window.location.reload(),
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
          },
          'Reload'
        )
      );
    }
    return this.props.children;
  }
}

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
const FlowBoardTabs = lazy(() => import('../pages/FlowBoardTabs'));
const ProposalsTabs = lazy(() => import('../pages/ProposalsTabs'));

// Capture Board (pre-solicitation intelligence)
const CaptureBoardTabs = lazy(() => import('../pages/CaptureBoardTabs'));

// GovCon Inbox
const GovConInbox = lazy(() => import('../pages/GovConInbox'));

// Past Performance Library
const PastPerformanceLibrary = lazy(() => import('../pages/PastPerformanceLibrary'));

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

// Wrapper component for lazy loading — guarded by RouteErrorBoundary so a chunk-load
// failure (e.g. a stale route chunk 404ing after a redeploy) is caught instead of
// surfacing as an unhandled promise rejection.
const LazyComponent = ({ component: Component }) => {
  return React.createElement(
    RouteErrorBoundary,
    null,
    React.createElement(
      Suspense,
      { fallback: React.createElement(Loading) },
      React.createElement(Component)
    )
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

      // Intake Lanes — retired; absorbed into the Capture Board funnel.
      // Redirect old links to /capture. (IntakeLanes.jsx page file kept on disk but no
      // longer imported/lazy-loaded from here — nothing renders it.)
      {
        path: 'intake-lanes',
        element: React.createElement(Navigate, { to: '/capture', replace: true }),
      },

      // Capture Board — pre-solicitation intelligence, bid/no-bid, dossier, compliance, knowledge
      {
        path: 'capture',
        element: React.createElement(LazyComponent, { component: CaptureBoardTabs }),
      },

      // Calendar — retired; owner uses an external calendar API instead of an in-app page.
      {
        path: 'calendar',
        element: React.createElement(Navigate, { to: '/dashboard', replace: true }),
      },

      // Tools & Features
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

      // Operator Updates — retired; content relocated to Discord notifications.
      {
        path: 'operator-updates',
        element: React.createElement(Navigate, { to: '/dashboard', replace: true }),
      },

      // Past Performance Library
      {
        path: 'past-performance',
        element: React.createElement(LazyComponent, { component: PastPerformanceLibrary }),
      },

      // Top-level utility pages
      {
        path: 'directories',
        element: React.createElement(LazyComponent, { component: Directories }),
      },
      // CEO Actions ("Command Center") — retired; notifications moved to Discord.
      {
        path: 'ceo-actions',
        element: React.createElement(Navigate, { to: '/dashboard', replace: true }),
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
