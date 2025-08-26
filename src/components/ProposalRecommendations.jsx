import { 
  Search, 
  FileText, 
  Phone, 
  Users, 
  FileSpreadsheet, 
  CheckCircle 
} from 'lucide-react';

const ProposalRecommendations = ({ proposal }) => {
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
            title: 'Schedule Initial Call',
            icon: <Phone size={20} className="text-primary-600" />,
            description: 'Set up a discovery call with the client to understand requirements',
            status: 'pending',
            action: 'Schedule'
          }
        ];
      case 'outline':
        return [
          {
            title: 'Draft Proposal Outline',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Create initial outline based on RFP requirements',
            status: 'pending',
            action: 'Start Outline'
          },
          {
            title: 'Identify Team Members',
            icon: <Users size={20} className="text-primary-600" />,
            description: 'Assign team members to proposal sections',
            status: 'pending',
            action: 'Assign Team'
          }
        ];
      case 'drafting':
        return [
          {
            title: 'Complete First Draft',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Finish initial draft of all proposal sections',
            status: 'pending',
            action: 'Continue Drafting'
          },
          {
            title: 'Review Compliance',
            icon: <CheckCircle size={20} className="text-primary-600" />,
            description: 'Ensure all RFP requirements are addressed',
            status: 'pending',
            action: 'Check Compliance'
          }
        ];
      case 'internal_review':
        return [
          {
            title: 'Internal Review',
            icon: <FileSpreadsheet size={20} className="text-primary-600" />,
            description: 'Conduct internal review with subject matter experts',
            status: 'pending',
            action: 'Start Review'
          },
          {
            title: 'Revise Based on Feedback',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Incorporate feedback from internal review',
            status: 'pending',
            action: 'Make Revisions'
          }
        ];
      case 'final_review':
        return [
          {
            title: 'Final Compliance Check',
            icon: <CheckCircle size={20} className="text-primary-600" />,
            description: 'Verify all requirements are met',
            status: 'pending',
            action: 'Verify'
          },
          {
            title: 'Prepare for Submission',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Compile all documents and prepare submission package',
            status: 'pending',
            action: 'Prepare'
          }
        ];
      case 'submitted':
        return [
          {
            title: 'Debrief Meeting',
            icon: <Users size={20} className="text-primary-600" />,
            description: 'Schedule a debrief meeting with the team',
            status: 'pending',
            action: 'Schedule'
          },
          {
            title: 'Archive Documents',
            icon: <FileText size={20} className="text-primary-600" />,
            description: 'Archive all proposal documents for future reference',
            status: 'pending',
            action: 'Archive'
          }
        ];
      default:
        return [];
    }
  };

  const steps = getNextSteps();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
            <div className="mr-3 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{step.title}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
            <button className="ml-2 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              {step.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalRecommendations;
