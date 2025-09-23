import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/ui/loading-spinner.jsx';

// Lazy load page components
const Layout = lazy(() => import('../components/Layout.jsx'));
const Dashboard = lazy(() => import('../pages/DashboardFixed.jsx'));
const ProposalDetails = lazy(() => import('../pages/ProposalDetails.jsx'));
const Calendar = lazy(() => import('../pages/Calendar.jsx'));
const Reminders = lazy(() => import('../pages/Reminders.jsx'));
const FlowBoard = lazy(() => import('../pages/FlowBoard.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));
const Error404 = lazy(() => import('../pages/Error404.jsx'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
);

// Wrapper component for lazy loading
const LazyComponent = ({ component: Component }) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

// Create a wrapper component that handles the base path
const BasePathWrapper = ({ children }) => {
  const location = useLocation();
  const basePath = process.env.VITE_BASE_URL || '/proposal-flow';
  
  // Redirect to include base path if not present
  if (!location.pathname.startsWith(basePath)) {
    return <Navigate to={`${basePath}${location.pathname}`} replace />;
  }
  
  return children;
};

const routes = [
  {
    path: '/',
    element: <BasePathWrapper><LazyComponent component={Layout} /></BasePathWrapper>,
    errorElement: <LazyComponent component={Error404} />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyComponent component={Dashboard} />,
      },
      {
        path: 'proposal/:id',
        element: <LazyComponent component={ProposalDetails} />,
      },
      {
        path: 'calendar',
        element: <LazyComponent component={Calendar} />,
      },
      {
        path: 'reminders',
        element: <LazyComponent component={Reminders} />,
      },
      {
        path: 'flowboard',
        element: <LazyComponent component={FlowBoard} />,
      },
      {
        path: 'reports',
        element: <LazyComponent component={Reports} />,
      },
      {
        path: '*',
        element: <LazyComponent component={Error404} />,
      },
    ],
  },
];

// Create router with base path
const BASE_PATH = '/proposal-flow';

export const router = createBrowserRouter(routes, {
  basename: BASE_PATH,
  future: {
    // Enable the new behavior for v7 of react-router-dom
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
  // Handle scroll restoration
  scrollRestoration: 'manual',
});
