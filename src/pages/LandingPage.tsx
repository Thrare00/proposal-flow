import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => (
  <div className="landing-container">
    <h1>ProposalFlow</h1>
    <p>
      The modern proposal management tool for government contractors.<br/>
      Organize deadlines, break down RFPs, and track progress with ease.
    </p>
    <Link to="/dashboard">
      <button className="cta-button">Get Started</button>
    </Link>
  </div>
);

export default LandingPage;
