import { useLoaderData } from 'react-router-dom';
// Using plain JavaScript objects instead of TypeScript types
import { Card, CardContent, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ProposalStatusBadge } from '../../components/ProposalStatusBadge.jsx';
import { UrgencyBadge } from '../../components/UrgencyBadge.jsx';

export function ProposalList() {
  const proposals = useLoaderData();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <Button to="/dashboard/proposals/new">
          New Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <h3>{proposal.title}</h3>
              <div className="flex gap-2">
                <ProposalStatusBadge status={proposal.status} />
                <UrgencyBadge urgency={proposal.metadata.urgency} />
              </div>
            </CardHeader>
            <CardContent>
              <p>Agency: {proposal.agency}</p>
              <p>Due Date: {new Date(proposal.dueDate).toLocaleDateString()}</p>
              <p>Type: {proposal.type}</p>
              <div className="mt-4">
                <Button to={`/dashboard/proposals/${proposal.id}`} variant="outline">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
