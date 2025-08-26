import { createBrowserRouter, RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/',
    element: () => import('../components/Layout.js'),
    children: [
      {
        index: true,
        element: () => import('../pages/DashboardFixed.js'),
      },
      {
        path: 'proposal/:id',
        element: () => import('../pages/ProposalDetails.js'),
      },
      {
        path: 'calendar',
        element: () => import('../pages/Calendar.js'),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
