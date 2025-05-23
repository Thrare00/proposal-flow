import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Proposal, Task, CalendarEvent, ProposalStatus } from '../types';

const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

interface ProposalContextType {
  proposals: Proposal[];
  isLoading: boolean;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>) => string;
  updateProposal: (id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>>) => void;
  deleteProposal: (id: string) => void;
  getProposal: (id: string) => Proposal | undefined;
  updateProposalStatus: (id: string, status: ProposalStatus) => void;
  addTask: (proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>) => string;
  updateTask: (proposalId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'proposalId' | 'createdAt'>>) => void;
  deleteTask: (proposalId: string, taskId: string) => void;
  loadInitialData: () => void;
  customEvents: CalendarEvent[];
  addCustomEvent: (event: Omit<CalendarEvent, 'id'>) => string;
  updateCustomEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteCustomEvent: (eventId: string) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const useProposalContext = (): ProposalContextType => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposalContext must be used within a ProposalProvider');
  }
  return context;
};

export const ProposalProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('customEvents');
    if (saved) {
      try {
        setCustomEvents(JSON.parse(saved));
      } catch (e) {
        setCustomEvents([]);
      }
    }
  }, []);

  const saveCustomEvents = useCallback((events: CalendarEvent[]) => {
    setCustomEvents(events);
    localStorage.setItem('customEvents', JSON.stringify(events));
  }, []);

  const addCustomEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const newEvent: CalendarEvent = { ...event, id };
    const updated = [...customEvents, newEvent];
    saveCustomEvents(updated);
    return id;
  }, [customEvents, saveCustomEvents]);

  const updateCustomEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    const updated = customEvents.map(ev => ev.id === eventId ? { ...ev, ...updates } : ev);
    saveCustomEvents(updated);
  }, [customEvents, saveCustomEvents]);

  const deleteCustomEvent = useCallback((eventId: string) => {
    const updated = customEvents.filter(ev => ev.id !== eventId);
    saveCustomEvents(updated);
  }, [customEvents, saveCustomEvents]);

  const setSampleData = useCallback(() => {
    const sampleProposals: Proposal[] = [
      {
        id: '1',
        title: 'DoD Training System RFP',
        agency: 'Department of Defense',
        dueDate: '2025-06-04T00:00:00.000Z',
        status: 'drafting',
        notes: 'This proposal requires security clearance documentation.',
        tasks: [
          {
            id: '101',
            proposalId: '1',
            title: 'Write Executive Summary',
            owner: 'Jane Smith',
            dueDate: '2025-05-25T00:00:00.000Z',
            completed: false,
            createdAt: '2025-05-23T00:00:00.000Z',
          },
          {
            id: '102',
            proposalId: '1',
            title: 'Prepare Cost Analysis',
            owner: 'John Doe',
            dueDate: '2025-05-30T00:00:00.000Z',
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
        agency: 'Environmental Protection Agency',
        dueDate: '2025-05-20T00:00:00.000Z',
        status: 'internal_review',
        notes: 'Need to emphasize environmental impact mitigation strategies.',
        tasks: [
          {
            id: '201',
            proposalId: '2',
            title: 'Complete Impact Analysis',
            owner: 'Sarah Johnson',
            dueDate: '2025-05-19T00:00:00.000Z',
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
        agency: 'Health and Human Services',
        dueDate: '2025-05-24T00:00:00.000Z',
        status: 'final_review',
        notes: 'Final compliance review needed before submission.',
        tasks: [
          {
            id: '301',
            proposalId: '3',
            title: 'Review HIPAA Compliance',
            owner: 'Michael Brown',
            dueDate: '2025-05-23T00:00:00.000Z',
            completed: false,
            createdAt: '2025-05-03T00:00:00.000Z',
          }
        ],
        createdAt: '2025-05-03T00:00:00.000Z',
        updatedAt: '2025-05-23T00:00:00.000Z',
        type: 'federal',
        files: []
      }
    ];

    setProposals(sampleProposals);
    localStorage.setItem('proposals', JSON.stringify(sampleProposals));
  }, [setProposals]);

  const loadInitialData = useCallback(() => {
    try {
      setIsLoading(true);
      const savedProposals = localStorage.getItem('proposals');
      if (savedProposals) {
        const parsedProposals = JSON.parse(savedProposals);
        if (Array.isArray(parsedProposals)) {
          const isValid = parsedProposals.every(proposal => 
            typeof proposal === 'object' &&
            typeof proposal.id === 'string' &&
            typeof proposal.title === 'string' &&
            typeof proposal.agency === 'string' &&
            typeof proposal.dueDate === 'string' &&
            ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'].includes(proposal.status) &&
            ['commercial', 'local_state', 'federal'].includes(proposal.type)
          );
          
          if (isValid) {
            setProposals(parsedProposals);
            setIsLoading(false);
            return;
          }
        }
      }
      setSampleData();
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setSampleData();
      setIsLoading(false);
    }
  }, [setSampleData]);

  const saveProposals = useCallback((newProposals: Proposal[]) => {
    setProposals(newProposals);
    localStorage.setItem('proposals', JSON.stringify(newProposals));
  }, [setProposals]);
  
  const addProposal = useCallback((proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>) => {
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
    return id;
  }, [saveProposals, getCurrentDateTime]);
  
  const updateProposal = useCallback((id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'files'>>) => {
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
  }, [saveProposals, getCurrentDateTime]);
  
  const deleteProposal = useCallback((id: string) => {
    const updatedProposals = proposals.filter(proposal => proposal.id !== id);
    saveProposals(updatedProposals);
  }, [saveProposals]);
  
  const getProposal = useCallback((id: string) => {
    return proposals.find(proposal => proposal.id === id);
  }, []);
  
  const updateProposalStatus = useCallback((id: string, status: ProposalStatus) => {
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
  }, [saveProposals, getCurrentDateTime]);
  
  const addTask = useCallback((proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>) => {
    const taskId = `${proposalId}-${Date.now()}`;
    const now = getCurrentDateTime();
    
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
    return taskId;
  }, [saveProposals, getCurrentDateTime]);
  
  const updateTask = useCallback((proposalId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'proposalId' | 'createdAt'>>) => {
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
  }, [saveProposals, getCurrentDateTime]);

  const deleteTask = useCallback((proposalId: string, taskId: string) => {
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
  }, [saveProposals, getCurrentDateTime]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const value = {
    proposals,
    isLoading,
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
  };

  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
};

export default ProposalProvider;