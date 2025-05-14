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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
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
            <li>Context awareness</li>
          </ul>
        </div>
      )
    },
    {
      id: 'architecture',
      title: 'Agent Architecture',
      icon: <Cpu className="w-5 h-5 text-purple-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Core Components:</h4>
          <ul>
            <li><strong>Perception Module:</strong> Processes inputs from the environment</li>
            <li><strong>Reasoning Engine:</strong> Makes decisions based on inputs and goals</li>
            <li><strong>Action Module:</strong> Executes actions in the environment</li>
            <li><strong>Memory:</strong> Stores information for future reference</li>
          </ul>
        </div>
      )
    },
    {
      id: 'capabilities',
      title: 'Key Capabilities',
      icon: <Brain className="w-5 h-5 text-green-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Advanced Capabilities:</h4>
          <ul>
            <li>Natural Language Understanding</li>
            <li>Contextual Decision Making</li>
            <li>Multi-step Task Execution</li>
            <li>Continuous Learning</li>
            <li>Multi-modal Processing</li>
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
          <h4>Data Handling:</h4>
          <ul>
            <li>Structured and unstructured data processing</li>
            <li>Real-time data analysis</li>
            <li>Knowledge graph integration</li>
            <li>Data versioning and lineage</li>
          </ul>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      icon: <ShieldCheck className="w-5 h-5 text-red-500" />,
      content: (
        <div className="prose dark:prose-invert max-w-none">
          <h4>Security Measures:</h4>
          <ul>
            <li>Data encryption at rest and in transit</li>
            <li>Role-based access control</li>
            <li>Audit logging</li>
            <li>Compliance with regulations (GDPR, HIPAA, etc.)</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Agent Guide
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Comprehensive documentation for working with AI Agents
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <button
                className={`w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none ${expandedSection === section.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                onClick={() => toggleSection(section.id)}
                aria-expanded={expandedSection === section.id}
                aria-controls={`${section.id}-content`}
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </span>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {expandedSection === section.id && (
                <div 
                  id={`${section.id}-content`}
                  className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Lightbulb className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                Ready to get started?
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>Explore our API documentation and integration guides to start building with AI Agents.</p>
              </div>
              <div className="mt-4">
                <a
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  View API Documentation <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentGuide;
