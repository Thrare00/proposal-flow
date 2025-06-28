import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Proposal, Task, CalendarEvent, ProposalStatus } from '../types/index.ts';
import { v4 as uuidv4 } from 'uuid';

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const getCurrentDateTime = (): string => {
  try {
    return new Date().toISOString();
  } catch (error) {
    console.error('Error getting current date:', error);
    return new Date(0).toISOString(); // Fallback to epoch
  }
};

interface ProposalContextType {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>) => OperationResult<string>;
  updateProposal: (id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>>) => OperationResult<void>;
  deleteProposal: (id: string) => OperationResult<void>;
  getProposal: (id: string) => Proposal | undefined;
  updateProposalStatus: (id: string, status: ProposalStatus) => OperationResult<void>;
  addTask: (proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>) => OperationResult<string>;
  updateTask: (proposalId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'proposalId' | 'createdAt'>>) => OperationResult<void>;
  deleteTask: (proposalId: string, taskId: string) => OperationResult<void>;
  loadInitialData: () => void;
  customEvents: CalendarEvent[];
  addCustomEvent: (event: Omit<CalendarEvent, 'id'>) => OperationResult<string>;
  updateCustomEvent: (eventId: string, updates: Partial<CalendarEvent>) => OperationResult<void>;
  deleteCustomEvent: (eventId: string) => OperationResult<void>;
  clearError: () => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const useProposalContext = (): ProposalContextType => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposalContext must be used within a ProposalProvider');
  }
  return {
    ...context,
    clearError: () => {
      context.error = null;
    }
  };
};

export const ProposalProvider = ({ children }: { children: ReactNode }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const saveProposals = useCallback((proposals: Proposal[]) => {
    try {
      localStorage.setItem('proposals', JSON.stringify(proposals));
      setProposals(proposals);
    } catch (err) {
      setError('Failed to save proposals');
      console.error('Error saving proposals:', err);
    }
  }, []);

  const loadInitialData = useCallback(() => {
    try {
      setIsLoading(true);
      const savedProposals = localStorage.getItem('proposals');
      if (savedProposals) {
        const parsedProposals = JSON.parse(savedProposals) as Proposal[];
        setProposals(parsedProposals);
      }
      
      const savedEvents = localStorage.getItem('customEvents');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents) as CalendarEvent[];
        setCustomEvents(parsedEvents);
      }
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const saveCustomEvents = useCallback((events: CalendarEvent[]) => {
    setCustomEvents(events);
    localStorage.setItem('customEvents', JSON.stringify(events));
  }, []);

  // Proposal Operations
  const addProposal = useCallback((proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>): OperationResult<string> => {
    try {
      const id = Date.now().toString();
      const now = getCurrentDateTime();
      const newProposal: Proposal = {
        ...proposal,
        id,
        tasks: [],
        files: [], 
        createdAt: now,
        updatedAt: now,
      };
      
      const updatedProposals = [...proposals, newProposal];
      saveProposals(updatedProposals);
      return { success: true, data: id };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add proposal');
      console.error('Error adding proposal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add proposal' };
    }
  }, [saveProposals, getCurrentDateTime]);

  const updateProposal = useCallback((id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>>): OperationResult<void> => {
    try {
      if (!id) {
        throw new Error('Proposal ID is required');
      }

      const updatedProposals = proposals.map(proposal => 
        proposal.id === id
          ? { 
              ...proposal, 
              ...updates, 
              updatedAt: getCurrentDateTime() 
            }
          : proposal
      );
      saveProposals(updatedProposals);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update proposal');
      console.error('Error updating proposal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update proposal' };
    }
  }, [saveProposals, getCurrentDateTime]);

  const deleteProposal = useCallback((id: string): OperationResult<void> => {
    try {
      if (!id) {
        throw new Error('Proposal ID is required');
      }

      const updatedProposals = proposals.filter(proposal => proposal.id !== id);
      saveProposals(updatedProposals);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete proposal');
      console.error('Error deleting proposal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete proposal' };
    }
  }, [saveProposals]);

  const getProposal = useCallback((id: string) => {
    return proposals.find(proposal => proposal.id === id);
  }, [proposals]);

  const updateProposalStatus = useCallback((id: string, status: ProposalStatus): OperationResult<void> => {
    try {
      if (!id) {
        throw new Error('Proposal ID is required');
      }

      const updatedProposals = proposals.map(proposal => 
        proposal.id === id
          ? { 
              ...proposal, 
              status, 
              updatedAt: getCurrentDateTime() 
            }
          : proposal
      );
      
      saveProposals(updatedProposals);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update proposal status');
      console.error('Error updating proposal status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update proposal status' };
    }
  }, [saveProposals, getCurrentDateTime]);

  // Task Operations
  const addTask = useCallback((proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>): OperationResult<string> => {
    try {
      if (!proposalId) {
        throw new Error('Proposal ID is required');
      }

      const now = getCurrentDateTime();
      const taskId = uuidv4();
      const updatedProposals = proposals.map(proposal => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            tasks: [
              ...proposal.tasks,
              {
                ...task,
                id: taskId,
                proposalId,
                createdAt: now,
              }
            ],
            updatedAt: now,
          };
        }
        return proposal;
      });
      
      saveProposals(updatedProposals);
      return { success: true, data: taskId };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add task');
      console.error('Error adding task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add task' };
    }
  }, [saveProposals, getCurrentDateTime]);

  const updateTask = useCallback((proposalId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'proposalId' | 'createdAt'>>): OperationResult<void> => {
    try {
      if (!proposalId || !taskId) {
        throw new Error('Proposal ID and Task ID are required');
      }

      const updatedProposals = proposals.map(proposal => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            tasks: proposal.tasks.map(task =>
              task.id === taskId
                ? { ...task, ...updates }
                : task
            ),
            updatedAt: getCurrentDateTime(),
          };
        }
        return proposal;
      });
      
      saveProposals(updatedProposals);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update task');
      console.error('Error updating task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update task' };
    }
  }, [saveProposals, getCurrentDateTime]);

  const deleteTask = useCallback((proposalId: string, taskId: string): OperationResult<void> => {
    try {
      if (!proposalId || !taskId) {
        throw new Error('Proposal ID and Task ID are required');
      }

      const updatedProposals = proposals.map(proposal => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            tasks: proposal.tasks.filter(task => task.id !== taskId),
            updatedAt: getCurrentDateTime(),
          };
        }
        return proposal;
      });
      
      saveProposals(updatedProposals);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete task');
      console.error('Error deleting task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' };
    }
  }, [saveProposals, getCurrentDateTime]);

  const addCustomEvent = useCallback((event: Omit<CalendarEvent, 'id'>): OperationResult<string> => {
    try {
      const eventId = uuidv4();
      const now = getCurrentDateTime();
      const updatedEvents = [
        ...customEvents,
        {
          ...event,
          id: eventId,
          createdAt: now,
        },
      ];
      saveCustomEvents(updatedEvents);
      return { success: true, data: eventId };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add event');
      console.error('Error adding event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add event' };
    }
  }, [saveCustomEvents, getCurrentDateTime]);

  const updateCustomEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>): OperationResult<void> => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const updatedEvents = customEvents.map(event =>
        event.id === eventId
          ? { ...event, ...updates }
          : event
      );
      saveCustomEvents(updatedEvents);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update event');
      console.error('Error updating event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update event' };
    }
  }, [saveCustomEvents]);

  const deleteCustomEvent = useCallback((eventId: string): OperationResult<void> => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const updatedEvents = customEvents.filter(event => event.id !== eventId);
      saveCustomEvents(updatedEvents);
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete event');
      console.error('Error deleting event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete event' };
    }
  }, [saveCustomEvents]);

  const setSampleData = useCallback(() => {
    const sampleProposals: Proposal[] = [
      {
        id: '1',
        title: 'DOD Security System',
        description: 'Development of a secure information management system for the Department of Defense',
        agency: 'Department of Defense',
        dueDate: '2025-06-04T00:00:00.000Z',
        status: 'drafting',
        notes: 'This proposal requires security clearance documentation.',
        tasks: [
          {
            id: '101',
            proposalId: '1',
            title: 'Write Executive Summary',
            description: 'Draft the executive summary section of the proposal',
            owner: 'Jane Smith',
            dueDate: '2025-05-25T00:00:00.000Z',
            status: 'pending',
            completed: false,
            createdAt: '2025-05-23T00:00:00.000Z',
          },
          {
            id: '102',
            proposalId: '1',
            title: 'Prepare Cost Analysis',
            description: 'Create detailed cost analysis for proposal',
            owner: 'John Doe',
            dueDate: '2025-05-30T00:00:00.000Z',
            status: 'pending',
            completed: false,
            createdAt: '2025-05-23T00:00:00.000Z',
          }
        ],
        createdAt: '2025-05-23T00:00:00.000Z',
        updatedAt: '2025-05-23T00:00:00.000Z',
        type: 'federal',
        files: []
      },
      {
        id: '2',
        title: 'EPA Environmental Assessment',
        description: 'Comprehensive environmental impact assessment for EPA compliance',
        agency: 'Environmental Protection Agency',
        dueDate: '2025-05-20T00:00:00.000Z',
        status: 'internal_review',
        notes: 'Need to emphasize environmental impact mitigation strategies.',
        tasks: [
          {
            id: '201',
            proposalId: '2',
            title: 'Complete Impact Analysis',
            description: 'Finalize environmental impact analysis',
            owner: 'Sarah Johnson',
            dueDate: '2025-05-19T00:00:00.000Z',
            status: 'completed',
            completed: true,
            createdAt: '2025-05-13T00:00:00.000Z',
          }
        ],
        createdAt: '2025-05-13T00:00:00.000Z',
        updatedAt: '2025-05-23T00:00:00.000Z',
        type: 'federal',
        files: []
      },
      {
        id: '3',
        title: 'HHS Healthcare Portal',
        description: 'Development of a secure healthcare management portal for HHS',
        agency: 'Health and Human Services',
        dueDate: '2025-05-24T00:00:00.000Z',
        status: 'final_review',
        notes: 'Final compliance review needed before submission.',
        tasks: [
          {
            id: '301',
            proposalId: '3',
            title: 'Review HIPAA Compliance',
            description: 'Conduct final HIPAA compliance review',
            owner: 'Michael Brown',
            dueDate: '2025-05-23T00:00:00.000Z',
            status: 'pending',
            completed: false,
            createdAt: '2025-05-03T00:00:00.000Z',
          }
        ],
        createdAt: '2025-05-03T00:00:00.000Z',
        updatedAt: '2025-05-23T00:00:00.000Z',
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const value = {
    proposals,
    isLoading,
    error,
    addProposal,
    updateProposal,
    deleteProposal,
    getProposal,
    updateProposalStatus,
    addTask,
    updateTask,
    deleteTask,
    loadInitialData,
    customEvents,
    addCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
    clearError: () => setError(null)

  };

  const value = {
    proposals,
    isLoading,
    error,
    addProposal,
    updateProposal,
    deleteProposal,
    getProposal,
    updateProposalStatus,
    addTask,
    updateTask,
    deleteTask,
    loadInitialData,
    customEvents,
    addCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
    clearError: () => setError(null)
  } as const;

  return <ProposalContext.Provider value={value}>{children}</ProposalContext.Provider>;
};

export default ProposalProvider;