import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/index.js';
import CeoActionForm from '../components/CeoActionForm.jsx';

export default function CeoActions() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">CEO Action Item</h1>

      <div className="max-w-2xl">
        <CeoActionForm />
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
