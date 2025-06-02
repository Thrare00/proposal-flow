import { useLoaderData } from 'react-router-dom';
import { Proposal } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProposalStatusBadge } from '../../components/ProposalStatusBadge';
import { UrgencyBadge } from '../../components/UrgencyBadge';

export function ProposalList() {
  const proposals = useLoaderData() as Proposal[];

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
