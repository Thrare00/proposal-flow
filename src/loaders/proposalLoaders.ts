import { Proposal } from '../../types';

export async function proposalLoader() {
  try {
    // Simulate API call
    const response = await fetch('/api/proposals');
    if (!response.ok) {
      throw new Error('Failed to load proposals');
    }
    const data = await response.json();
    return data as Proposal[];
  } catch (error) {
    throw new Error('Failed to load proposals');
  }
}

export async function proposalDetailsLoader(id: string) {
  try {
    // Simulate API call
    const response = await fetch(`/api/proposals/${id}`);
    if (!response.ok) {
      throw new Error('Failed to load proposal details');
    }
    const data = await response.json();
    return data as Proposal;
  } catch (error) {
    throw new Error('Failed to load proposal details');
  }
}
