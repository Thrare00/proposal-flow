import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyStateHero() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-rare-dark rounded-2xl p-12 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <TrendingUp className="text-rare-lime" size={40} strokeWidth={1.5} />
        </div>

        <h1 className="mb-3 text-3xl font-rare-serif text-white">
          Your pipeline is a clean slate.
        </h1>

        <p className="mb-8 text-white/60">
          Start building your first bid and watch your pipeline grow.
        </p>

        <Link
          to="/proposals/new"
          className="inline-block rounded bg-rare-crimson px-6 py-3 font-semibold text-white transition-colors hover:bg-rare-crimson-dark"
        >
          Start Your First Bid
        </Link>
      </div>
    </div>
  );
}
