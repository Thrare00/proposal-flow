import type { RouteObject } from 'react-router-dom';
import type {
  LandingPageProps,
  DashboardProps,
  ProposalListProps,
  ProposalDetailsProps,
  ProposalFormProps,
  CalendarProps,
  FlowBoardProps,
  MarketResearchProps,
  SOWAnalyzerProps,
  GuideProps
} from './components';

export type LandingPage = (props: LandingPageProps) => any;
export type Dashboard = (props: DashboardProps) => any;
export type ProposalList = (props: ProposalListProps) => any;

export type LazyComponent = () => Promise<{
  default: (props: any) => any;
}>;

export type LazyComponentType = (props: any) => any;

export type ProposalDetails = (props: ProposalDetailsProps) => any;
export type ProposalForm = (props: ProposalFormProps) => any;
export type Calendar = (props: CalendarProps) => any;
export type FlowBoard = (props: FlowBoardProps) => any;
export type MarketResearch = (props: MarketResearchProps) => any;
export type SOWAnalyzer = (props: SOWAnalyzerProps) => any;
export type Guide = (props: GuideProps) => any;

export type AppRoutes = RouteObject[];

// Helper types for route definitions
export type RouteConfig = {
  path: string;
  element: any | LazyComponent;
  children?: RouteConfig[];
};

export type RouteConfigMap = Record<string, RouteConfig>;

export type RouteParams = {
  [key: string]: string;
};

export type RouteMatch = {
  params: RouteParams;
  pathname: string;
  search: string;
  hash: string;
};
