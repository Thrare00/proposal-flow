/// <reference types="react" />

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  type ProposalStatus = 'intake' | 'outline' | 'drafting' | 'internal_review' | 'final_review' | 'submitted';
  
  interface Proposal {
    id: string;
    title: string;
    status: ProposalStatus;
    dueDate: string;
    // Add other proposal properties as needed
  }
  
  interface Task {
    id: string;
    title: string;
    proposalId: string;
    // Add other task properties as needed
  }
  
  interface ProposalCardProps {
    proposal: Proposal;
  }
  
  interface TaskCardProps {
    task: Task;
    proposalTitle: string;
    showProposalLink?: boolean;
  }
}

export {};
