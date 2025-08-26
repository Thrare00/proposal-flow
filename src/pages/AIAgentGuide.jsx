import { useState } from 'react';
import { 
  Lightbulb, 
  Cpu, 
  Brain, 
  Database, 
  ShieldCheck, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AIAgentGuide = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction to AI Agents',
      icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <p>AI Agents are autonomous systems that can perform tasks, make decisions, and interact with users and other systems. They combine artificial intelligence with the ability to take actions in digital environments.</p>
          <h4>Key Characteristics:</h4>
          <ul>
            <li>Autonomous operation</li>
            <li>Goal-oriented behavior</li>
            <li>Learning and adaptation</li>
            <li>Interaction with environment</li>
          </ul>
        </div>
      )
    },
    {
      id: 'capabilities',
      title: 'Capabilities',
      icon: <Cpu className="w-5 h-5 text-green-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>AI Agents can:</h4>
          <ul>
            <li>Process natural language</li>
            <li>Make decisions based on data</li>
            <li>Learn from interactions</li>
            <li>Automate repetitive tasks</li>
            <li>Provide intelligent recommendations</li>
          </ul>
        </div>
      )
    },
    {
      id: 'implementation',
      title: 'Implementation',
      icon: <Brain className="w-5 h-5 text-purple-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Implementation Approaches:</h4>
          <ul>
            <li>Rule-based systems</li>
            <li>Machine learning models</li>
            <li>Neural networks</li>
            <li>Reinforcement learning</li>
          </ul>
        </div>
      )
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: <Database className="w-5 h-5 text-yellow-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Data is crucial for AI Agents:</h4>
          <ul>
            <li>Training data quality affects performance</li>
            <li>Continuous learning requires data pipelines</li>
            <li>Privacy and security considerations</li>
            <li>Data preprocessing and cleaning</li>
          </ul>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security',
      icon: <ShieldCheck className="w-5 h-5 text-red-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Security Considerations:</h4>
          <ul>
            <li>Secure API integrations</li>
            <li>Data encryption</li>
            <li>Access controls</li>
            <li>Regular security audits</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">AI Agent Guide</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Learn how to build and work with AI Agents</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center">
                <span className="mr-3">
                  {section.icon}
                </span>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSection === section.id && (
              <div className="px-6 pb-6 pt-2">
                {section.content}
                <div className="mt-4">
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Learn more <ArrowRight className="ml-1 w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Ready to get started?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Start building your own AI Agent today with our comprehensive documentation and developer tools.
        </p>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          View Documentation
        </button>
      </div>
    </div>
  );
};

export default AIAgentGuide;
