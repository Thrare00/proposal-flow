import { 
  LayoutDashboard, 
  CalendarDays, 
  LayoutGrid,
  Menu,
  ChevronLeft,
  PlusCircle,
  BookOpen,
  FileSearch
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import ThemeSlider from './ThemeSlider';
import { useState } from 'react';

interface NavigationItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface NavLinkProps {
  isActive: boolean;
}

const navigationItems: NavigationItem[] = [
  { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: "/dashboard/flowboard", icon: <LayoutGrid size={18} />, label: 'Flow Board' },
  { to: "/dashboard/calendar", icon: <CalendarDays size={18} />, label: 'Calendar' },
  { to: "/dashboard/guide", icon: <BookOpen size={18} />, label: 'Guide' },
  { to: "/dashboard/reminders", icon: <Clipboard size={18} />, label: 'Reminders' },
  { to: '/dashboard/sow-analyzer', icon: <FileSearch size={18} />, label: 'SOW Analyzer' }
];

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const location = useLocation();

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
              <Link to="/dashboard" className="flex items-center">
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
          {navigationItems.map((item) => (
            <NavLink
              to={item.to}
              key={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`
              }
            >
              {isMenuCollapsed ? item.icon : null}
              {!isMenuCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="ml-64 md:ml-64 pt-16">
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
    </div>
  );
};

export default Layout;