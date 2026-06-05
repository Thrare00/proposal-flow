import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { buildApiUrl } from '../lib/runtimeApi.js';
import { normalizeProposal } from '../../shared/proposalNormalization.js';

const ProposalContext = createContext(undefined);

async function fetchJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const useProposalContext = () => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposalContext must be used within a ProposalProvider');
  }
  return context;
};

export const ProposalProvider = ({ children }) => {
  const [proposals, setProposals] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProposals = useCallback(async () => {
    const data = await fetchJson(buildApiUrl('/proposals'));
    const normalized = Array.isArray(data) ? data.map((proposal) => normalizeProposal(proposal)) : [];
    setProposals(normalized);
    return normalized;
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    const data = await fetchJson(buildApiUrl('/calendar-events'));
    setCustomEvents(Array.isArray(data) ? data : []);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchProposals(), fetchCalendarEvents()]);
    } catch (loadError) {
      console.error('Failed to load proposal context:', loadError);
      setError(loadError);
      throw loadError;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCalendarEvents, fetchProposals]);

  useEffect(() => {
    refreshAll().catch(() => {});
  }, [refreshAll]);

  const addProposal = useCallback(async (proposal) => {
    const created = await fetchJson(buildApiUrl('/proposals'), {
      method: 'POST',
      body: JSON.stringify(normalizeProposal(proposal)),
    });
    await fetchProposals();
    return created?.id;
  }, [fetchProposals]);

  const updateProposal = useCallback(async (id, updates) => {
    const updated = await fetchJson(buildApiUrl(`/proposals/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await fetchProposals();
    return normalizeProposal(updated);
  }, [fetchProposals]);

  const deleteProposal = useCallback(async (id) => {
    setProposals((current) => current.filter((proposal) => proposal.id !== id));
  }, []);

  const getProposal = useCallback((id) => {
    const proposal = proposals.find((item) => item.id === id);
    return proposal ? normalizeProposal(proposal) : undefined;
  }, [proposals]);

  const updateProposalStatus = useCallback(async (id, status) => {
    return updateProposal(id, { status });
  }, [updateProposal]);

  const updateTaskStatus = useCallback(async (taskId, updates) => {
    const proposal = proposals.find((item) => (item.tasks || []).some((task) => task.id === taskId));
    if (!proposal) {
      return null;
    }

    const tasks = proposal.tasks.map((task) => (
      task.id === taskId
        ? { ...task, ...updates, lastUpdated: new Date().toISOString() }
        : task
    ));

    return updateProposal(proposal.id, { tasks });
  }, [proposals, updateProposal]);

  const addTask = useCallback(async (proposalId, task) => {
    const proposal = getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const newTask = {
      ...task,
      id: `${proposalId}-${Date.now()}`,
      proposalId,
      createdAt: new Date().toISOString(),
    };

    await updateProposal(proposalId, {
      tasks: [...(proposal.tasks || []), newTask],
    });
    return newTask.id;
  }, [getProposal, updateProposal]);

  const updateTask = useCallback(async (proposalId, taskId, updates) => {
    const proposal = getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const tasks = (proposal.tasks || []).map((task) => (
      task.id === taskId ? { ...task, ...updates } : task
    ));

    return updateProposal(proposalId, { tasks });
  }, [getProposal, updateProposal]);

  const deleteTask = useCallback(async (proposalId, taskId) => {
    const proposal = getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    return updateProposal(proposalId, {
      tasks: (proposal.tasks || []).filter((task) => task.id !== taskId),
    });
  }, [getProposal, updateProposal]);

  const addCustomEvent = useCallback(async (event) => {
    const created = await fetchJson(buildApiUrl('/calendar-events'), {
      method: 'POST',
      body: JSON.stringify(event),
    });
    await fetchCalendarEvents();
    return created?.id;
  }, [fetchCalendarEvents]);

  const updateCustomEvent = useCallback(async (event) => {
    await fetchJson(buildApiUrl(`/calendar-events/${event.id}`), {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    await fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const deleteCustomEvent = useCallback(async (eventId) => {
    await fetchJson(buildApiUrl(`/calendar-events/${eventId}`), {
      method: 'DELETE',
    });
    await fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const value = {
    proposals,
    customEvents,
    isLoading,
    error,
    fetchProposals: refreshAll,
    loadInitialData: refreshAll,
    addProposal,
    updateProposal,
    deleteProposal,
    getProposal,
    updateTaskStatus,
    updateProposalStatus,
    addTask,
    updateTask,
    deleteTask,
    addCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
  };

  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
};

export default ProposalProvider;
