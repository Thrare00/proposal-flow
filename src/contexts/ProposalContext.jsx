
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateUUID } from '../utils/uuidUtils.js';

// Helper function to get current date time in ISO format
const getCurrentDateTime = () => new Date().toISOString();

// Create context with a default value of undefined
const ProposalContext = createContext(undefined);

// Custom hook to use the proposal context
export const useProposalContext = () => {
    const context = useContext(ProposalContext);
    if (context === undefined) {
        throw new Error('useProposalContext must be used within a ProposalProvider');
    }
    return context;
};

// Main provider component
export const ProposalProvider = ({ children }) => {
    // Initialize state at the top level of the component
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customEvents, setCustomEvents] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        const saved = localStorage.getItem('customEvents');
        if (saved) {
            try {
                setCustomEvents(JSON.parse(saved));
            }
            catch (e) {
                setCustomEvents([]);
            }
        }
    }, []);
    const saveCustomEvents = useCallback((events) => {
        setCustomEvents(events);
        localStorage.setItem('customEvents', JSON.stringify(events));
    }, []);
    const addCustomEvent = useCallback((event) => {
        const id = generateUUID();
        const newEvent = { ...event, id };
        const updated = [...customEvents, newEvent];
        saveCustomEvents(updated);
        return id;
    }, [customEvents, saveCustomEvents]);
    const updateCustomEvent = useCallback((event) => {
        const updated = customEvents.map(ev => ev.id === event.id ? event : ev);
        saveCustomEvents(updated);
    }, [customEvents, saveCustomEvents]);
    const deleteCustomEvent = useCallback((eventId) => {
        const updated = customEvents.filter(ev => ev.id !== eventId);
        saveCustomEvents(updated);
    }, [customEvents, saveCustomEvents]);
    const setSampleData = useCallback(() => {
        const sampleProposals = [
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
    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            const savedProposals = localStorage.getItem('proposals');
            if (savedProposals) {
                const parsedProposals = JSON.parse(savedProposals);
                if (Array.isArray(parsedProposals)) {
                    const isValid = parsedProposals.every(proposal => typeof proposal === 'object' &&
                        typeof proposal.id === 'string' &&
                        typeof proposal.title === 'string' &&
                        typeof proposal.agency === 'string' &&
                        typeof proposal.dueDate === 'string' &&
                        ['intake', 'outline', 'drafting', 'internal_review', 'final_review', 'submitted'].includes(proposal.status) &&
                        ['commercial', 'local_state', 'federal'].includes(proposal.type));
                    if (isValid) {
                        setProposals(parsedProposals);
                        setIsLoading(false);
                        return parsedProposals;
                    }
                }
            }
            setSampleData();
            setIsLoading(false);
        }
        catch (error) {
            console.error('Error loading proposals:', error);
            setSampleData();
            setIsLoading(false);
            throw error;
        }
    }, [setSampleData]);
    const saveProposals = useCallback((newProposals) => {
        setProposals(newProposals);
        localStorage.setItem('proposals', JSON.stringify(newProposals));
    }, [setProposals]);
    const addProposal = useCallback((proposal) => {
        const id = Date.now().toString();
        const now = getCurrentDateTime();
        const newProposal = {
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
    const updateProposal = useCallback((id, updates) => {
        const updatedProposals = proposals.map(proposal => proposal.id === id
            ? {
                ...proposal,
                ...updates,
                updatedAt: getCurrentDateTime()
            }
            : proposal);
        saveProposals(updatedProposals);
    }, [saveProposals, getCurrentDateTime]);
    const deleteProposal = useCallback((id) => {
        const updatedProposals = proposals.filter(proposal => proposal.id !== id);
        saveProposals(updatedProposals);
    }, [saveProposals]);
    const getProposal = useCallback((id) => {
        return proposals.find(proposal => proposal.id === id);
    }, []);
    const updateTaskStatus = useCallback((taskId, updates) => {
        const updatedProposals = proposals.map(proposal => {
            const updatedTasks = proposal.tasks.map(task => {
                if (task.id === taskId) {
                    return {
                        ...task,
                        ...updates,
                        lastUpdated: getCurrentDateTime()
                    };
                }
                return task;
            });
            return {
                ...proposal,
                tasks: updatedTasks,
                updatedAt: getCurrentDateTime()
            };
        });
        saveProposals(updatedProposals);
    }, [saveProposals, getCurrentDateTime]);



    const updateProposalStatus = useCallback((id, status) => {
        const updatedProposals = proposals.map(proposal => proposal.id === id
            ? {
                ...proposal,
                status,
                updatedAt: getCurrentDateTime()
            }
            : proposal);
        saveProposals(updatedProposals);
    }, [saveProposals, getCurrentDateTime]);
    const addTask = useCallback((proposalId, task) => {
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
    const updateTask = useCallback((proposalId, taskId, updates) => {
        const updatedProposals = proposals.map(proposal => {
            if (proposal.id === proposalId) {
                return {
                    ...proposal,
                    tasks: proposal.tasks.map(task => task.id === taskId
                        ? { ...task, ...updates }
                        : task),
                    updatedAt: getCurrentDateTime(),
                };
            }
            return proposal;
        });
        saveProposals(updatedProposals);
    }, [saveProposals, getCurrentDateTime]);
    const deleteTask = useCallback((proposalId, taskId) => {
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

    const fetchProposals = useCallback(async (forceRefresh = false) => {
        try {
            setIsLoading(true);
            
            // If we have cached data and not forcing refresh, return cached data
            if (proposals.length > 0 && !forceRefresh) {
                return proposals;
            }
            
            // Try to load from localStorage first
            const savedProposals = localStorage.getItem('proposals');
            if (savedProposals) {
                const parsedProposals = JSON.parse(savedProposals);
                if (Array.isArray(parsedProposals) && parsedProposals.length > 0) {
                    setProposals(parsedProposals);
                    return parsedProposals;
                }
            }
            
            // If no local data, load sample data
            setSampleData();
            return proposals;
            
        } catch (error) {
            console.error('Error fetching proposals:', error);
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [proposals, setSampleData]);

    const value = {
        proposals,
        isLoading,
        error,
        customEvents,
        fetchProposals,
        addProposal,
        updateProposal,
        deleteProposal,
        getProposal,
        updateProposalStatus,
        addTask,
        updateTask,
        deleteTask,
        loadInitialData,
        addCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
    };
    return <ProposalContext.Provider value={value}>{children}</ProposalContext.Provider>;
};
export default ProposalProvider;
//# sourceMappingURL=ProposalContext.js.map