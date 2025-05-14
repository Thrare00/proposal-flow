import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Clipboard, 
  Clock, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    const proposals = localStorage.getItem('proposals');
    if (proposals) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              ProposalFlow
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Streamline your government proposal process with a powerful, intuitive platform built for success.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary px-8 py-3 text-lg flex items-center space-x-2"
            >
              <Sparkles size={18} className="animate-pulse" />
              <span>Get Started</span>
            </button>
            <button
              onClick={() => navigate('/guide')}
              className="btn btn-secondary px-8 py-3 text-lg"
            >
              View Guide
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-16">
              Why Choose ProposalFlow?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:shadow-lg transition-shadow">
                <Building size={32} className="text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Agency-Specific Templates
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Pre-built templates for common agency requirements, saving you time and ensuring compliance.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:shadow-lg transition-shadow">
                <Clipboard size={32} className="text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Task Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track tasks, deadlines, and responsibilities across your team with real-time updates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:shadow-lg transition-shadow">
                <Clock size={32} className="text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Deadline Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Never miss a deadline with our integrated calendar and automated reminders.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card hover:shadow-lg transition-shadow">
                <Users size={32} className="text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Team Collaboration
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Collaborate seamlessly with your team, assign tasks, and track progress in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Transform Your Proposal Process
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              ProposalFlow is designed to help government contractors streamline their proposal process, reduce errors, and increase win rates.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Benefit 1 */}
              <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card">
                <ShieldCheck size={24} className="text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Compliance First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Built-in compliance checks and agency-specific requirements to ensure your proposals meet all necessary standards.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-card">
                <CheckCircle size={24} className="text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Proven Success
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our platform has helped hundreds of contractors win more government contracts by streamlining their proposal process.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary px-8 py-3 text-lg flex items-center space-x-2"
              >
                <Sparkles size={18} className="animate-pulse" />
                <span>Start Your First Proposal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
