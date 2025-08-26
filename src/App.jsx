import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/DashboardFixed.jsx';
import FlowBoard from './pages/FlowBoard.jsx';
import Reminders from './pages/Reminders.jsx';
import Calendar from './pages/Calendar.jsx';
import ProposalDetails from './pages/ProposalDetails.jsx';
import ProposalForm from './pages/ProposalForm.jsx';
import MarketResearch from './pages/MarketResearch.jsx';
import SOWAnalyzer from './pages/SOWAnalyzer.jsx';
import Guide from './pages/Guide.jsx';
import AIAgentGuide from './pages/AIAgentGuide.jsx';
import ProposalDevelopmentGuide from './pages/ProposalDevelopmentGuide.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flowboard" element={<FlowBoard />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/proposals/new" element={<ProposalForm />} />
        <Route path="/proposals/:id" element={<ProposalDetails />} />
        <Route path="/proposals/:id/edit" element={<ProposalForm />} />
        <Route path="/proposals/:id/analyze" element={<SOWAnalyzer />} />
        <Route path="/market-research" element={<MarketResearch />} />
        <Route path="/sow-analyzer" element={<SOWAnalyzer />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/ai-agent-guide" element={<AIAgentGuide />} />
        <Route path="/proposal-development-guide" element={<ProposalDevelopmentGuide />} />
      </Route>
    </Routes>
  );
}