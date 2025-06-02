import React from 'react';
import { RouteObject } from 'react-router-dom';
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

export type LandingPage = React.FC<LandingPageProps>;
export type Dashboard = React.FC<DashboardProps>;
export type ProposalList = React.FC<ProposalListProps>;

export type LazyComponent = () => Promise<{
  default: ComponentType<any>;
}>;

export type LazyComponentType = ComponentType<any>;

export type ProposalDetails = LazyComponentType<ProposalDetailsProps>;
export type ProposalForm = LazyComponentType<ProposalFormProps>;
export type Calendar = LazyComponentType<CalendarProps>;
export type FlowBoard = LazyComponentType<FlowBoardProps>;
export type MarketResearch = LazyComponentType<MarketResearchProps>;
export type SOWAnalyzer = LazyComponentType<SOWAnalyzerProps>;
export type Guide = LazyComponentType<GuideProps>;

export type AppRoutes = RouteObject[];
