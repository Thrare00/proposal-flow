import { createBrowserRouter, RouterProvider, RouteObject } from 'react-router-dom';
import { createElement } from 'react';

// Export router component
export function AppRouter() {
  return createElement(RouterProvider, { router });
}
