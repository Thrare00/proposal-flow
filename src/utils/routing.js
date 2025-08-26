import { useLocation } from 'react-router-dom';

export const ROUTES = {
  ROOT: '/',
  LANDING: '/landing',
  DASHBOARD: '/dashboard',
  PROPOSALS: '/dashboard/proposals',
  PROPOSAL_NEW: '/dashboard/proposals/new',
  PROPOSAL_DETAILS: '/dashboard/proposals/:id',
  PROPOSAL_ANALYZE: '/dashboard/proposals/:id/analyze',
  PROPOSAL_EDIT: '/dashboard/proposals/:id/edit',
  FLOWBOARD: '/dashboard/flowboard',
  MARKET_RESEARCH: '/dashboard/market-research',
  CALENDAR: '/dashboard/calendar',
  REMINDERS: '/dashboard/reminders',
  GUIDE: '/dashboard/guide',
  AI_GUIDE: '/dashboard/guide/ai',
  PROPOSAL_GUIDE: '/dashboard/guide/proposal',
  SOW_ANALYZER: '/dashboard/tools/sow-analyzer',
  SETTINGS: '/dashboard/settings'
};

export const useRoutePrefix = () => {
  const location = useLocation();
  const isGitHubPages = location.pathname.startsWith('/proposal-flow');
  const isDev = window.location.hostname === 'localhost';
  
  return isGitHubPages 
    ? '/proposal-flow'
    : isDev 
    ? ''
    : '/dashboard';
};

export const getRoutePath = (path, params = {}) => {
  const prefix = useRoutePrefix();
  let route = `${prefix}${path}`;
  
  // Replace parameter placeholders
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, value);
  });
  
  return route;
};

export const getRouteWithParams = (path, params) => {
  return getRoutePath(path, params);
};

export const useIntelligentRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (path, options = {}) => {
    const { params = {}, state = {} } = options;
    const targetPath = getRoutePath(path, params);
    
    // Check if we're already on the target path
    if (location.pathname === targetPath) return;
    
    // Add smooth scroll to top for page transitions
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Navigate to the target path with state
    navigate(targetPath, { state: { ...location.state, ...state } });
  };
};

export const getRouteMetadata = (path) => {
  const routeMetadata = {
    [ROUTES.ROOT]: {
      title: 'Home',
      description: 'Welcome to Proposal Flow',
    },
    [ROUTES.DASHBOARD]: {
      title: 'Dashboard',
      description: 'Your proposal dashboard',
    },
    [ROUTES.PROPOSALS]: {
      title: 'Proposals',
      description: 'View and manage your proposals',
    },
    [ROUTES.PROPOSAL_NEW]: {
      title: 'New Proposal',
      description: 'Create a new proposal',
    },
    [ROUTES.PROPOSAL_DETAILS]: {
      title: 'Proposal Details',
      description: 'View proposal details',
    },
    [ROUTES.FLOWBOARD]: {
      title: 'Flow Board',
      description: 'Manage your workflow',
    },
    [ROUTES.CALENDAR]: {
      title: 'Calendar',
      description: 'View your schedule',
    },
    [ROUTES.GUIDE]: {
      title: 'Guide',
      description: 'Help and documentation',
    },
    [ROUTES.SETTINGS]: {
      title: 'Settings',
      description: 'Application settings',
    },
  };

  return routeMetadata[path] || {
    title: 'Proposal Flow',
    description: 'Proposal management system',
  };
};
