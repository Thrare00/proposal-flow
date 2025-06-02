import { createBrowserRouter, RouterProvider, RouteObject } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Error404 } from './components/Error404';
import FlowBoard from './pages/FlowBoard';
import Dashboard from './pages/Dashboard';
import { createElement } from 'react';

// Define routes
const routes: RouteObject[] = [
  { path: '/', element: createElement(LoadingSpinner) },
  { path: '/dashboard', element: createElement(Dashboard) },
  { path: '/proposals', element: createElement(LoadingSpinner) },
  { path: '/proposals/:id', element: createElement(LoadingSpinner) },
  { path: '/proposals/new', element: createElement(LoadingSpinner) },
  { path: '/calendar', element: createElement(LoadingSpinner) },
  { path: '/flowboard', element: createElement(FlowBoard) },
  { path: '/research', element: createElement(LoadingSpinner) },
  { path: '/sow', element: createElement(LoadingSpinner) },
  { path: '/guide', element: createElement(LoadingSpinner) },
  { path: '*', element: createElement(Error404) }
];

// Create router
const router = createBrowserRouter(routes);

// Export router and AppRouter component
export default router;

export function AppRouter() {
  return createElement(RouterProvider, { router });
}
