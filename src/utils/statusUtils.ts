import { ProposalStatus } from '../types';

export const getStatusName = (status: ProposalStatus): string => {
  switch (status) {
    case 'intake': return 'Intake';
    case 'outline': return 'Outline';
    case 'drafting': return 'Drafting';
    case 'internal_review': return 'Internal Review';
    case 'final_review': return 'Final Review';
    case 'submitted': return 'Submitted';
    default: return 'Unknown';
  }
};

export const getStatusColor = (status: ProposalStatus): string => {
  switch (status) {
    case 'intake': return 'bg-gray-100 text-gray-800';
    case 'outline': return 'bg-primary-100 text-primary-800';
    case 'drafting': return 'bg-accent-100 text-accent-800';
    case 'internal_review': return 'bg-warning-100 text-warning-800';
    case 'final_review': return 'bg-success-100 text-success-800';
    case 'submitted': return 'bg-success-500 text-white';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusBorderColor = (status: ProposalStatus): string => {
  switch (status) {
    case 'intake': return 'border-gray-300';
    case 'outline': return 'border-primary-300';
    case 'drafting': return 'border-accent-300';
    case 'internal_review': return 'border-warning-300';
    case 'final_review': return 'border-success-300';
    case 'submitted': return 'border-success-500';
    default: return 'border-gray-300';
  }
};

export const getStatusOrder = (status: ProposalStatus): number => {
  switch (status) {
    case 'intake': return 0;
    case 'outline': return 1;
    case 'drafting': return 2;
    case 'internal_review': return 3;
    case 'final_review': return 4;
    case 'submitted': return 5;
    default: return 6;
  }
};

export const getAllStatuses = (): ProposalStatus[] => {
  return [
    'intake',
    'outline',
    'drafting',
    'internal_review',
    'final_review',
    'submitted'
  ];
};

export const getNextStatus = (status: ProposalStatus): ProposalStatus | null => {
  switch (status) {
    case 'intake': return 'outline';
    case 'outline': return 'drafting';
    case 'drafting': return 'internal_review';
    case 'internal_review': return 'final_review';
    case 'final_review': return 'submitted';
    case 'submitted': return null;
    default: return null;
  }
};

export const getPreviousStatus = (status: ProposalStatus): ProposalStatus | null => {
  switch (status) {
    case 'outline': return 'intake';
    case 'drafting': return 'outline';
    case 'internal_review': return 'drafting';
    case 'final_review': return 'internal_review';
    case 'submitted': return 'final_review';
    case 'intake': return null;
    default: return null;
  }
};