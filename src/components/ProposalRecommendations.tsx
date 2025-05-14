import { 
  Search, 
  FileText, 
  Phone, 
  Users, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface ProposalRecommendationsProps {
  proposal: {
    title: string;
    status: string;
    dueDate: string;
    agency: string;
    naicsCodes: string[];
  };
}

const ProposalRecommendations = ({ proposal }: ProposalRecommendationsProps) => {
  const getNextSteps = () => {
    switch (proposal.status) {
      case 'intake':
        return [
          {
            title: 'Conduct Market Research',
            icon: <Search size={20} className="text-primary-600" />,
            description: `Analyze USAspending.gov and FPDS for ${proposal.agency} trends`,
            status: 'pending',
            action: 'Start Research'
          },
          {
            title: 'Update Proposal Kit',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Ensure corporate credentials and past performance are up to date',
            status: 'pending',
            action: 'Update Kit'
          },
          {
            title: 'Pre-qualify Subcontractors',
            icon: <Users size={20} className="text-primary-600" />,
            description: 'Identify and qualify potential subcontractors for key scopes',
            status: 'pending',
            action: 'Start Qualification'
          }
        ];
      case 'outline':
        return [
          {
            title: 'Review Draft Specifications',
            icon: <FileSpreadsheet size={20} className="text-primary-600" />,
            description: 'Analyze agency requirements and prepare clarification questions',
            status: 'pending',
            action: 'Review Specs'
          },
          {
            title: 'Develop Technical Approach',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Create initial technical narrative and capability chart',
            status: 'pending',
            action: 'Start Drafting'
          },
          {
            title: 'Engage with Team',
            icon: <Phone size={20} className="text-primary-600" />,
            description: 'Schedule team coordination meeting',
            status: 'pending',
            action: 'Schedule Meeting'
          }
        ];
      case 'drafting':
        return [
          {
            title: 'Address Evaluation Criteria',
            icon: <CheckCircle size={20} className="text-primary-600" />,
            description: 'Ensure all evaluation criteria are covered in proposal',
            status: 'pending',
            action: 'Review Criteria'
          },
          {
            title: 'Create Uniqueness Matrix',
            icon: <FileSpreadsheet size={20} className="text-primary-600" />,
            description: 'Develop matrix to address non-duplication concerns',
            status: 'pending',
            action: 'Create Matrix'
          },
          {
            title: 'Prepare Cost Model',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Develop detailed cost proposal with justification',
            status: 'pending',
            action: 'Start Modeling'
          }
        ];
      case 'internal_review':
        return [
          {
            title: 'Conduct Technical Review',
            icon: <CheckCircle size={20} className="text-primary-600" />,
            description: 'Review technical approach and compliance',
            status: 'pending',
            action: 'Schedule Review'
          },
          {
            title: 'Verify Compliance',
            icon: <FileSpreadsheet size={20} className="text-primary-600" />,
            description: 'Check formatting and submission requirements',
            status: 'pending',
            action: 'Verify Compliance'
          },
          {
            title: 'Prepare Submission',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Finalize proposal and prepare submission',
            status: 'pending',
            action: 'Prepare Submission'
          }
        ];
      case 'final_review':
        return [
          {
            title: 'Conduct Final Review',
            icon: <CheckCircle size={20} className="text-primary-600" />,
            description: 'Perform final quality check',
            status: 'pending',
            action: 'Start Review'
          },
          {
            title: 'Prepare Clarifications',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Prepare for potential clarification questions',
            status: 'pending',
            action: 'Prepare Responses'
          },
          {
            title: 'Finalize Documents',
            icon: <FileSpreadsheet size={20} className="text-primary-600" />,
            description: 'Finalize all proposal documents',
            status: 'pending',
            action: 'Finalize Docs'
          }
        ];
      default:
        return [];
    }
  };

  const nextSteps = getNextSteps();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {nextSteps.map((step, index) => (
        <div key={index} className="card bg-white border border-gray-200 dark:border-gray-800">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              {step.icon}
              <h3 className="text-lg font-medium">{step.title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{step.description}</p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                step.status === 'completed' ? 'bg-green-100 text-green-800' :
                step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {step.status === 'completed' ? 'Completed' :
                 step.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </span>
              <button className="btn btn-primary btn-sm">
                {step.action}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProposalRecommendations;
