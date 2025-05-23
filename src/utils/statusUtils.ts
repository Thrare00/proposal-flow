import type { ProposalStatus } from '../types';

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
    case 'intake': return 'bg-gray-50 text-gray-700';
    case 'outline': return 'bg-blue-50 text-blue-800';
    case 'drafting': return 'bg-purple-50 text-purple-800';
    case 'internal_review': return 'bg-yellow-50 text-yellow-800';
    case 'final_review': return 'bg-green-50 text-green-800';
    case 'submitted': return 'bg-green-600 text-white';
    default: return 'bg-gray-50 text-gray-700';
  }
};

export const getStatusBorderColor = (status: ProposalStatus): string => {
  switch (status) {
    case 'intake': return 'border-gray-200';
    case 'outline': return 'border-blue-200';
    case 'drafting': return 'border-purple-200';
    case 'internal_review': return 'border-yellow-200';
    case 'final_review': return 'border-green-200';
    case 'submitted': return 'border-green-600';
    default: return 'border-gray-200';
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