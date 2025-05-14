import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Proposal, ProposalStatus, ProposalType } from '../types';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  proposalId: string;
  owner?: string;
}

interface ProposalContextType {
  proposals: Proposal[];
  isLoading: boolean;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => string;
  updateProposal: (id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>) => void;
  deleteProposal: (id: string) => void;
  getProposal: (id: string) => Proposal | undefined;
  updateProposalStatus: (id: string, status: ProposalStatus) => void;
  addTask: (proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>) => string;
  updateTask: (proposalId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'proposalId' | 'createdAt'>>) => void;
  deleteTask: (proposalId: string, taskId: string) => void;
  loadInitialData: () => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const useProposalContext = () => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposalContext must be used within a ProposalProvider');
  }
  return context;
};

export const ProposalProvider = ({ children }: { children: ReactNode }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setSampleData = useCallback(() => {
    const sampleProposals: Proposal[] = [
      {
        id: '1',
        title: 'DoD Training System RFP',
        agency: 'Department of Defense',
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: ProposalStatus.DRAFTING,
        notes: 'This proposal requires security clearance documentation.',
        tasks: [
          {
            id: '101',
            proposalId: '1',
            title: 'Write Executive Summary',
            owner: 'Jane Smith',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
          },
          {
            id: '102',
            proposalId: '1',
            title: 'Prepare Cost Analysis',
            owner: 'John Doe',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: ProposalType.FEDERAL
      },
      {
        id: '2',
        title: 'EPA Environmental Assessment',
        agency: 'Environmental Protection Agency',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: ProposalStatus.INTERNAL_REVIEW,
        notes: 'Need to emphasize environmental impact mitigation strategies.',
        tasks: [
          {
            id: '201',
            proposalId: '2',
            title: 'Complete Impact Analysis',
            owner: 'Sarah Johnson',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            completed: true,
          }
        ],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        type: ProposalType.FEDERAL
      },
      {
        id: '3',
        title: 'HHS Healthcare Portal',
        agency: 'Health and Human Services',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: ProposalStatus.FINAL_REVIEW,
        notes: 'Final compliance review needed before submission.',
        tasks: [
          {
            id: '301',
            proposalId: '3',
            title: 'Review HIPAA Compliance',
            owner: 'Michael Brown',
            dueDate: new Date().toISOString(),
            completed: false,
          }
        ],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        type: ProposalType.FEDERAL
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
          // Validate the parsed data
          const isValid = parsedProposals.every(proposal => 
            typeof proposal === 'object' &&
            typeof proposal.id === 'string' &&
            typeof proposal.title === 'string' &&
            typeof proposal.agency === 'string' &&
            typeof proposal.dueDate === 'string' &&
            Object.values(ProposalStatus).includes(proposal.status as ProposalStatus) &&
            Object.values(ProposalType).includes(proposal.type as ProposalType)
          );
          
          if (isValid) {
            setProposals(parsedProposals);
            setIsLoading(false);
            return;
          }
        }
      }
      // If we get here, either there was an error or no valid saved proposals
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
  
  const addProposal = useCallback((proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newProposal: Proposal = {
      ...proposal,
      id,
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };
    
    const updatedProposals = [...proposals, newProposal];
    saveProposals(updatedProposals);
    return id;
  }, [saveProposals]);
  
  const updateProposal = useCallback((id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>) => {
    const updatedProposals = proposals.map(proposal => 
      proposal.id === id
        ? { 
            ...proposal, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          }
        : proposal
    );
    saveProposals(updatedProposals);
  }, [saveProposals]);
  
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
            updatedAt: new Date().toISOString() 
          }
        : proposal
    );
    saveProposals(updatedProposals);
  }, [saveProposals]);
  
  const addTask = useCallback((proposalId: string, task: Omit<Task, 'id' | 'proposalId' | 'createdAt'>) => {
    const taskId = `${proposalId}-${Date.now()}`;
    const now = new Date().toISOString();
    
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
  }, [saveProposals]);
  
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
          updatedAt: new Date().toISOString(),
        };
      }
      return proposal;
    });
    
    saveProposals(updatedProposals);
  }, [saveProposals]);
  
  const deleteTask = useCallback((proposalId: string, taskId: string) => {
    const updatedProposals = proposals.map(proposal => {
      if (proposal.id === proposalId) {
        return {
          ...proposal,
          tasks: proposal.tasks.filter(task => task.id !== taskId),
          updatedAt: new Date().toISOString(),
        };
      }
      return proposal;
    });
    
    saveProposals(updatedProposals);
  }, [saveProposals]);
  
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
  };
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
};