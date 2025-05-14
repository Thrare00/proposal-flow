import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LayoutGrid, 
  CalendarDays, 
  Bell, 
  Search, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  Users,
  Link,
  Code
} from 'lucide-react';

const GettingStarted = () => {
  const sections = [
    {
      title: 'Dashboard Overview',
      icon: <LayoutDashboard size={32} className="text-primary-600" />,
      description: 'The dashboard provides a quick overview of your proposals, upcoming deadlines, and important notifications. Use it to stay on top of your work and prioritize tasks.',
      features: [
        'View proposal status at a glance',
        'Track upcoming deadlines',
        'Access recent activity',
        'View notifications and reminders'
      ]
    },
    {
      title: 'Flow Board',
      icon: <LayoutGrid size={32} className="text-primary-600" />,
      description: 'The Flow Board is your main workspace for managing proposals through their lifecycle. Drag and drop cards between columns to track progress and assign tasks.',
      features: [
        'Visualize proposal workflow',
        'Assign tasks and deadlines',
        'Track progress with status updates',
        'Collaborate with team members'
      ]
    },
    {
      title: 'Calendar & Reminders',
      icon: <CalendarDays size={32} className="text-primary-600" />,
      description: 'Stay organized with our integrated calendar and reminder system. Set deadlines, schedule meetings, and get notified of important dates.',
      features: [
        'View proposals by date',
        'Set deadlines and reminders',
        'Schedule meetings and appointments',
        'Get automatic notifications'
      ]
    },
    {
      title: 'Market Research',
      icon: <Search size={32} className="text-primary-600" />,
      description: 'Access powerful market research tools to find opportunities and analyze competition. Connect with FPDS and USA Spending databases for comprehensive data.',
      features: [
        'Search government contracts',
        'Analyze market trends',
        'Track competitors',
        'Generate research reports'
      ]
    },
    {
      title: 'AI Assistant',
      icon: <MessageSquare size={32} className="text-primary-600" />,
      description: 'Get help from our AI assistant for proposal writing, research, and workflow optimization. Ask questions and get personalized guidance.',
      features: [
        'Proposal writing assistance',
        'Research question generation',
        'Workflow optimization',
        'Personalized recommendations'
      ]
    },
    {
      title: 'Team Collaboration',
      icon: <Users size={32} className="text-primary-600" />,
      description: 'Collaborate with your team in real-time using our built-in chat, comments, and task assignment features. Stay connected and productive.',
      features: [
        'Real-time chat and comments',
        'Task assignment and tracking',
        'File sharing and version control',
        'Activity tracking and notifications'
      ]
    },
    {
      title: 'App Integrations',
      icon: <Link size={32} className="text-primary-600" />,
      description: 'Integrate ProposalFlow with your favorite tools to streamline your workflow and boost productivity.',
      features: [
        'Slack integration for notifications',
        'Microsoft Teams integration',
        'Google Workspace integration',
        'Jira integration for task management'
      ]
    },
    {
      title: 'API & Automation',
      icon: <Code size={32} className="text-primary-600" />,
      description: 'Automate your workflow with our powerful API and integration capabilities.',
      features: [
        'REST API for custom integrations',
        'Webhooks for real-time updates',
        'Automated proposal generation',
        'Custom workflow automation'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Getting Started with ProposalFlow</h1>
      
      <p className="text-lg text-gray-600 mb-12">
        Welcome to ProposalFlow! This guide will help you get started with our platform and make the most of its features. Follow these steps to streamline your proposal management process.
      </p>

      <div className="space-y-12">
        {sections.map((section, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-start space-x-4 mb-4">
              {section.icon}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{section.description}</p>
              </div>
            </div>

            <div className="pl-12 border-l-2 border-primary-600 dark:border-primary-400">
              <ul className="space-y-2">
                {section.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-2">
                    <ChevronRight size={16} className="text-primary-600 dark:text-primary-400" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first proposal and start organizing your workflow today!
        </p>
        <NavLink 
          to="/dashboard/proposals/new" 
          className="btn btn-primary flex items-center justify-center space-x-2"
        >
          <FileText size={18} />
          <span>Create First Proposal</span>
        </NavLink>
      </div>
    </div>
  );
};

export default GettingStarted;
