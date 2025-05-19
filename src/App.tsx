import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ProposalForm from '@/pages/ProposalForm';
import ProposalDetails from '@/pages/ProposalDetails';
import FlowBoard from '@/pages/FlowBoard';
import MarketResearch from '@/pages/MarketResearch';
import GettingStarted from '@/pages/GettingStarted';
import Calendar from '@/pages/Calendar';
import Reminders from '@/pages/Reminders';
import Guide from '@/pages/Guide';
import Home from '@/pages/Home';
import LandingPage from '@/pages/LandingPage';
import SOWAnalyzer from '@/pages/SOWAnalyzer';
import AIAgentGuide from '@/pages/AIAgentGuide';
import ProposalDevelopmentGuide from '@/pages/ProposalDevelopmentGuide';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="home" element={<Home />} />
          <Route path="proposals/new" element={<ProposalForm />} />
          <Route path="proposals/:id" element={<ProposalDetails />} />
          <Route path="proposals/:id/analyze" element={<SOWAnalyzer />} />
          <Route path="proposals/:id/edit" element={<ProposalForm />} />
          <Route path="flow" element={<FlowBoard />} />
          <Route path="market-research" element={<MarketResearch />} />
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="guide" element={<Guide />} />
          <Route path="sow-analyzer" element={<SOWAnalyzer />} />
          <Route path="ai-agent-guide" element={<AIAgentGuide />} />
          <Route path="proposal-guide" element={<ProposalDevelopmentGuide />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;