import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProposalProvider } from './contexts/ProposalContext.js';
import Layout from './components/Layout.js';
import ProposalForm from './pages/ProposalForm.js';
import ProposalDetails from './pages/ProposalDetails.js';
import FlowBoard from './pages/FlowBoard.js';
import MarketResearch from './pages/MarketResearch.js';
import Calendar from './pages/Calendar.js';
import Reminders from './pages/Reminders.js';
import Guide from './pages/Guide.js';
import Dashboard from './pages/DashboardFixed.js';
import SOWAnalyzer from './pages/SOWAnalyzer.js';
import AIAgentGuide from './pages/AIAgentGuide.js';
import ProposalDevelopmentGuide from './pages/ProposalDevelopmentGuide.js';
import TestPage from './pages/TestPage.js';
import SimpleTest from './pages/SimpleTest.js';

function App() {
  return (
    <ProposalProvider>
      <HashRouter basename="/proposal-flow">
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="proposals/new" element={<ProposalForm />} />
          <Route path="proposals/:id" element={<ProposalDetails />} />
          <Route path="proposals/:id/analyze" element={<SOWAnalyzer />} />
          <Route path="proposals/:id/edit" element={<ProposalForm />} />
          <Route path="flow-board" element={<FlowBoard />} />
          <Route path="market-research" element={<MarketResearch />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="guide" element={<Guide />} />
          <Route path="sow-analyzer" element={<SOWAnalyzer />} />
          <Route path="ai-agent-guide" element={<AIAgentGuide />} />
          <Route path="proposal-guide" element={<ProposalDevelopmentGuide />} />
          <Route path="test" element={<TestPage />} />
          <Route path="simple-test" element={<SimpleTest />} />
        </Route>
      </Routes>
      </HashRouter>
    </ProposalProvider>
  );
}

export default App;