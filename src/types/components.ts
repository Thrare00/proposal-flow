import React from 'react';

export type ComponentType = React.ComponentType<any>;
export type LazyComponent<T> = React.LazyExoticComponent<T>;

export type LandingPageProps = {};
export type DashboardProps = {};
export type ProposalListProps = {};
export type ProposalDetailsProps = { id: string };
export type ProposalFormProps = {};
export type CalendarProps = {};
export type FlowBoardProps = {};
export type MarketResearchProps = {};
export type SOWAnalyzerProps = {};
export type GuideProps = {};

export type LandingPage = React.FC<LandingPageProps>;
export type Dashboard = React.FC<DashboardProps>;
export type ProposalList = React.FC<ProposalListProps>;
export type ProposalDetails = React.FC<ProposalDetailsProps>;
export type ProposalForm = React.FC<ProposalFormProps>;
export type Calendar = React.FC<CalendarProps>;
export type FlowBoard = React.FC<FlowBoardProps>;
export type MarketResearch = React.FC<MarketResearchProps>;
export type SOWAnalyzer = React.FC<SOWAnalyzerProps>;
export type Guide = React.FC<GuideProps>;
