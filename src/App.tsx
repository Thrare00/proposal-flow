import { Routes, Route, Navigate } from 'react-router-dom';
import { ProposalProvider } from './contexts/ProposalContext';
import Layout from './components/Layout';
import ProposalForm from './pages/ProposalForm';
import ProposalDetails from './pages/ProposalDetails';
import FlowBoard from './pages/FlowBoard';
import MarketResearch from './pages/MarketResearch';
import Calendar from './pages/Calendar';
import Reminders from './pages/Reminders';
import Guide from './pages/Guide';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard'; // Added import for Dashboard
import SOWAnalyzer from './pages/SOWAnalyzer';
import AIAgentGuide from './pages/AIAgentGuide';
import ProposalDevelopmentGuide from './pages/ProposalDevelopmentGuide';

function App() {
  return (
    <ProposalProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route path="" element={<Dashboard />} />
          <Route path="proposals/new" element={<ProposalForm />} />
          <Route path="proposals/:id" element={<ProposalDetails />} />
          <Route path="proposals/:id/analyze" element={<SOWAnalyzer />} />
          <Route path="proposals/:id/edit" element={<ProposalForm />} />
          <Route path="flowboard" element={<FlowBoard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="guide" element={<Guide />} />
          <Route path="ai-guide" element={<AIAgentGuide />} />
          <Route path="proposal-guide" element={<ProposalDevelopmentGuide />} />
          <Route path="sow-analyzer" element={<SOWAnalyzer />} />
          <Route path="market-research" element={<MarketResearch />} />
          <Route path="home" element={<Home />} />
        </Route>
        <Route path="*" element={<Navigate to="/proposal-flow/" replace />} />
      </Routes>
    </ProposalProvider>
  );
}

export default App;