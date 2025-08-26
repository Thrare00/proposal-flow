import React from 'react';
import { Link } from 'react-router-dom';
import ProposalIcon from '../assets/proposal-icon.svg';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        <img src={ProposalIcon} alt="ProposalFlow Logo" className="w-16 h-16 mb-4" />
        <h1 className="text-4xl md:text-6xl font-bold text-blue-900 dark:text-white mb-4">
          ProposalFlow
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
          The modern proposal management tool for government contractors.<br/>
          Organize deadlines, break down RFPs, and track progress with ease.
        </p>
        <Link to="/proposal-flow/#/dashboard" replace>
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
