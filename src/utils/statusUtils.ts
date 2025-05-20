import { ProposalStatus } from '../types';

export const getStatusName = (status: ProposalStatus): string => {
  switch (status) {
    case ProposalStatus.INTAKE: return 'Intake';
    case ProposalStatus.OUTLINE: return 'Outline';
    case ProposalStatus.DRAFTING: return 'Drafting';
    case ProposalStatus.INTERNAL_REVIEW: return 'Internal Review';
    case ProposalStatus.FINAL_REVIEW: return 'Final Review';
    case ProposalStatus.SUBMITTED: return 'Submitted';
    default: return 'Unknown';
  }
};

export const getStatusColor = (status: ProposalStatus): string => {
  switch (status) {
    case ProposalStatus.INTAKE: return 'bg-gray-50 text-gray-700';
    case ProposalStatus.OUTLINE: return 'bg-blue-50 text-blue-800';
    case ProposalStatus.DRAFTING: return 'bg-purple-50 text-purple-800';
    case ProposalStatus.INTERNAL_REVIEW: return 'bg-yellow-50 text-yellow-800';
    case ProposalStatus.FINAL_REVIEW: return 'bg-green-50 text-green-800';
    case ProposalStatus.SUBMITTED: return 'bg-green-600 text-white';
    default: return 'bg-gray-50 text-gray-700';
  }
};

export const getStatusBorderColor = (status: ProposalStatus): string => {
  switch (status) {
    case ProposalStatus.INTAKE: return 'border-gray-200';
    case ProposalStatus.OUTLINE: return 'border-blue-200';
    case ProposalStatus.DRAFTING: return 'border-purple-200';
    case ProposalStatus.INTERNAL_REVIEW: return 'border-yellow-200';
    case ProposalStatus.FINAL_REVIEW: return 'border-green-200';
    case ProposalStatus.SUBMITTED: return 'border-green-600';
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
    ProposalStatus.INTAKE,
    ProposalStatus.OUTLINE,
    ProposalStatus.DRAFTING,
    ProposalStatus.INTERNAL_REVIEW,
    ProposalStatus.FINAL_REVIEW,
    ProposalStatus.SUBMITTED
  ];
};

export const getNextStatus = (status: ProposalStatus): ProposalStatus | null => {
  switch (status) {
    case ProposalStatus.INTAKE: return ProposalStatus.OUTLINE;
    case ProposalStatus.OUTLINE: return ProposalStatus.DRAFTING;
    case ProposalStatus.DRAFTING: return ProposalStatus.INTERNAL_REVIEW;
    case ProposalStatus.INTERNAL_REVIEW: return ProposalStatus.FINAL_REVIEW;
    case ProposalStatus.FINAL_REVIEW: return ProposalStatus.SUBMITTED;
    case ProposalStatus.SUBMITTED: return null;
    default: return null;
  }
};

export const getPreviousStatus = (status: ProposalStatus): ProposalStatus | null => {
  switch (status) {
    case ProposalStatus.OUTLINE: return ProposalStatus.INTAKE;
    case ProposalStatus.DRAFTING: return ProposalStatus.OUTLINE;
    case ProposalStatus.INTERNAL_REVIEW: return ProposalStatus.DRAFTING;
    case ProposalStatus.FINAL_REVIEW: return ProposalStatus.INTERNAL_REVIEW;
    case ProposalStatus.SUBMITTED: return ProposalStatus.FINAL_REVIEW;
    case ProposalStatus.INTAKE: return null;
    default: return null;
  }
};