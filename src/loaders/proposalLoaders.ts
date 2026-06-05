import { Proposal } from '../../types';
import { buildApiUrl } from '../lib/runtimeApi.js';

export async function proposalLoader() {
  try {
    const response = await fetch(buildApiUrl('/proposals'));
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
    const response = await fetch(buildApiUrl(`/proposals/${id}`));
    if (!response.ok) {
      throw new Error('Failed to load proposal details');
    }
    const data = await response.json();
    return data as Proposal;
  } catch (error) {
    throw new Error('Failed to load proposal details');
  }
}
