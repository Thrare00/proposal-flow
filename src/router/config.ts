import { createBrowserRouter } from 'react-router-dom';
import { routeConfig } from './route-config.jsx';

export const router = createBrowserRouter(routeConfig, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});
