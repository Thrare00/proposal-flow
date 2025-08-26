import { createBrowserRouter } from 'react-router-dom';

const routes = [
  {
    path: '/',
    element: () => import('../components/Layout.jsx'),
    children: [
      {
        index: true,
        element: () => import('../pages/DashboardFixed.jsx'),
      },
      {
        path: 'proposal/:id',
        element: () => import('../pages/ProposalDetails.jsx'),
      },
      {
        path: 'calendar',
        element: () => import('../pages/Calendar.jsx'),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
