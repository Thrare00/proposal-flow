import { useLocation, useNavigate } from 'react-router-dom';
import { Proposal, ProposalType, URGENCY_LEVELS } from '../types/index.ts';

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
} as const;

export type RoutePaths = typeof ROUTES[keyof typeof ROUTES];

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

export const getRoutePath = (path: RoutePaths, params: Record<string, string> = {}): string => {
  const prefix = useRoutePrefix();
  let route = `${prefix}${path}`;
  
  // Replace parameter placeholders
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, value);
  });
  
  return route;
};

export const getRouteWithParams = (path: RoutePaths, params: Record<string, string>): string => {
  return getRoutePath(path, params);
};

export const useIntelligentRouting = () => {
  const navigate = useNavigate();

  const navigateToProposal = (proposal: Proposal) => {
    const isHighPriority = proposal.urgency === 'high' || proposal.urgency === 'critical';
    
    // High priority proposals go directly to details
    if (isHighPriority) {
      navigate(getRoutePath(ROUTES.PROPOSAL_DETAILS, { id: proposal.id }));
    } else {
      // Lower priority proposals go to proposals list
      navigate(getRoutePath(ROUTES.PROPOSALS));
    }
  };

  const navigateToNextTask = (proposal: Proposal) => {
    const nextTask = proposal.tasks.find(t => !t.completed);
    if (nextTask) {
      navigate(getRoutePath(ROUTES.PROPOSAL_DETAILS, { id: proposal.id }));
    } else {
      navigate(getRoutePath(ROUTES.PROPOSALS));
    }
  };

  const navigateToTypeSpecificRoute = (proposalType: ProposalType) => {
    switch (proposalType) {
      case 'commercial':
        navigate(getRoutePath(ROUTES.MARKET_RESEARCH));
        break;
      case 'local_state':
        navigate(getRoutePath(ROUTES.CALENDAR));
        break;
      case 'federal':
        navigate(getRoutePath(ROUTES.SOW_ANALYZER));
        break;
      default:
        navigate(getRoutePath(ROUTES.DASHBOARD));
    }
  };

  return {
    navigateToProposal,
    navigateToNextTask,
    navigateToTypeSpecificRoute
  };
};

export const getRouteMetadata = (path: string): {
  title: string;
  description: string;
  requiredPermissions?: string[];
} => {
  const metadataMap: Record<string, ReturnType<typeof getRouteMetadata>> = {
    [ROUTES.PROPOSALS]: {
      title: 'Proposals List',
      description: 'View and manage all proposals',
      requiredPermissions: ['view_proposals']
    },
    [ROUTES.PROPOSAL_NEW]: {
      title: 'New Proposal',
      description: 'Create a new proposal',
      requiredPermissions: ['create_proposals']
    },
    [ROUTES.CALENDAR]: {
      title: 'Calendar',
      description: 'View proposal deadlines and events',
      requiredPermissions: ['view_calendar']
    },
    [ROUTES.ROOT]: {
      title: 'Proposal Flow',
      description: 'Proposal management system'
    }
  };

  return metadataMap[path] || {
    title: 'Proposal Flow',
    description: 'Proposal management system'
  };
};
