import { useState } from 'react';
import { 
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  Clock,
  Users,
  Building,
  Shield,
  Calendar
} from 'lucide-react';

interface GuideSection {
  title: string;
  icon: any;
  items: GuideItem[];
}

interface GuideItem {
  title: string;
  description: string;
  icon: any;
}

const flowGuides: GuideSection[] = [
  {
    title: "Pre-Solicitation Phase",
    icon: BookOpen,
    items: [
      {
        title: "Market Intelligence",
        description: "• Use USAspending.gov, FPDS, agency portals to track spend trends for your core NAICS/PSC codes.\n• Flag recurring task orders (vacancy prep, aggregate supply, recycling pilots) and set up saved searches.",
        icon: FileText
      },
      {
        title: "Capability Readiness",
        description: "• Maintain an up-to-date 'Proposal Kit': corporate credentials, past-performance synopses, technical narratives, cost models, LOI template.\n• Refresh SAM and DSBS entries with your latest wins and certifications.",
        icon: FileText
      },
      {
        title: "Strategic Teaming",
        description: "• Pre-qualify subs/partners for key scopes (janitorial, crushing, magnet sorting).\n• Execute MOUs that define roles, in-kind value, and timelines—ready to convert to LOIs.",
        icon: Users
      }
    ]
  },
  {
    title: "Synopsis & Solicitation Phase",
    icon: FileText,
    items: [
      {
        title: "Early Engagement",
        description: "• React swiftly to pre-solicitation notices: review draft specs, ask clarify-questions in writing, gauge teaming interest.",
        icon: Clock
      },
      {
        title: "Proposal Development",
        description: "• Mirror government verbiage (use 'shall,' 'must,' 'will').\n• Address every evaluation criterion in distinct, labeled sections: Technical Approach, Management Plan, Past Performance, Cost Proposal.\n• Embed a Uniqueness Matrix or Capability Chart to pre-empt non-duplication or relevance questions.",
        icon: FileText
      },
      {
        title: "Compliance & Submission",
        description: "• Follow the agency's formatting, page-count, and submission instructions to the letter.\n• Submit at least 24 hours before deadline, confirm receipt, and monitor for amendments.",
        icon: Shield
      }
    ]
  },
  {
    title: "Post-Submission & Award",
    icon: FileText,
    items: [
      {
        title: "Clarifications & Negotiations",
        description: "• Be prepared to respond to questions or 'award-without-discussion' clarifications.\n• If negotiations occur, reconfirm scope changes, price impacts, and schedule implications in writing.",
        icon: Building
      },
      {
        title: "Award Kick-off",
        description: "• Host a formal kick-off meeting with the agency POC: review Statement of Work, deliverables, milestones, reporting cadence.\n• Update your internal Project Charter to reflect the awarded scope, contract value, and key dates.",
        icon: Calendar
      }
    ]
  },
  {
    title: "Transition to Project Management",
    icon: FileText,
    items: [
      {
        title: "Subcontractor Onboarding",
        description: "• Before Award Closure: issue draft subcontracts/Purchase Orders to pre-qualified subs with scope, deliverables, and provisional rates.\n• Expectation Setting: hold kickoff calls with each sub—review SOW, quality standards, safety rules, reporting formats, and payment milestones.",
        icon: Users
      },
      {
        title: "Mobilization & Scheduling",
        description: "• Use a rolling Gantt or calendar-day tracker that aligns contract milestones (e.g., key pickup, phase completions, inspections).\n• Assign a dedicated Project Manager who: coordinates daily field briefs and weekly status reviews.\n• Monitors critical path tasks and flags delays before they cascade.",
        icon: Clock
      },
      {
        title: "Quality & Performance Monitoring",
        description: "• Implement layered QC: daily field audits, photo-punch-list sign-offs, weekly executive dashboards.\n• Track sub-performance metrics (on-time arrival, punch-list closure, safety incidents) and enforce corrective actions or penalty clauses.",
        icon: Shield
      },
      {
        title: "Communication Protocols",
        description: "• Establish a clear RACI for all stakeholders (agency, PM, subs).\n• Send concise weekly reports: progress vs. plan, risks/issues, upcoming actions, budget vs. actual.",
        icon: Users
      },
      {
        title: "Change Management",
        description: "• Use a formal 'Scope Change Request' process for any additions or deletions; log approvals, impact assessments, and cost adjustments.",
        icon: FileText
      },
      {
        title: "Close-Out & Lessons Learned",
        description: "• Upon final acceptance, capture lessons learned in a short 'after-action' that highlights successes, hiccups, and improvement opportunities.\n• Archive all deliverables and subcontract records for audit readiness and to strengthen your proposal kit for future bids.",
        icon: FileText
      }
    ]
  }
];

const FlowGuides = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="space-y-6">
      {flowGuides.map((section, index) => (
        <div key={index} className="bg-white rounded-lg shadow-card">
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <section.icon className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-lg">{section.title}</h3>
            </div>
            {expandedSections[section.title] ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections[section.title] && (
            <div className="border-t border-gray-200">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="border-b border-gray-200 last:border-0 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <item.icon className="w-5 h-5 text-primary-600 mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FlowGuides;
