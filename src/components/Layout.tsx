import { 
  LayoutDashboard, 
  CalendarDays, 
  LayoutGrid, 
  Menu,
  Clipboard,
  ChevronLeft,
  PlusCircle,
  BookOpen,
  FileSearch
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import ThemeSlider from './ThemeSlider';
import { useState } from 'react';

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const location = useLocation();
  const basePath = '/proposal-flow';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                {isMenuCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
              </button>
              <Link to={`${basePath}/dashboard`} className="flex items-center">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">ProposalFlow</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeSlider />
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-y-16 left-0 ${isMenuCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 md:block transform transition-transform duration-200 ease-in-out z-50`}>
        <nav className="flex-1">
          {[
            { to: `${basePath}/dashboard`, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { to: `${basePath}/dashboard/flow`, icon: <LayoutGrid size={18} />, label: 'Flow Board' },
            { to: `${basePath}/dashboard/calendar`, icon: <CalendarDays size={18} />, label: 'Calendar' },
            { to: `${basePath}/dashboard/guide`, icon: <BookOpen size={18} />, label: 'Guide' },
            { to: `${basePath}/dashboard/reminders`, icon: <Clipboard size={18} />, label: 'Reminders' },
            { to: '/dashboard/sow-analyzer', icon: <FileSearch size={18} />, label: 'SOW Analyzer' }
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-4 py-3 transition-colors duration-200 ${
                location.pathname.startsWith(item.to) || 
                (location.pathname === '/dashboard' && item.to === '/dashboard')
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
              {!isMenuCollapsed && <span className="ml-2">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <main className={`flex-1 overflow-y-auto ml-16 ${isMenuCollapsed ? 'ml-16' : 'ml-64'} p-6 bg-gray-50 dark:bg-gray-900 z-0`}>
        <div className="pt-16">
          <div className="flex justify-end mb-6">
            <NavLink 
              to="/dashboard/proposals/new" 
              className="btn btn-primary bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-900 dark:hover:bg-primary-800"
            >
              <PlusCircle size={18} />
              <span>New Proposal</span>
            </NavLink>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;