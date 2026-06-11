import {
  LayoutDashboard,
  LayoutGrid,
  Menu,
  ChevronLeft,
  Activity,
  BookOpen,
  Target,
  DollarSign,
  Inbox,
  Radio,
  Layers,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom'; // Removed useLocation
import ThemeSlider from './ThemeSlider.jsx';
import { useEffect, useState } from 'react';
import AutomationConsole from './AutomationConsole';
// Removed Dashboard import as it's handled by App.tsx

// Navigation items (relative to router basename)
const navigationItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: 'intake-lanes', icon: <Layers size={18} />, label: 'Intake Lanes' },
  { to: 'capture', icon: <Target size={18} />, label: 'Capture Board' },
  { to: 'flowboard', icon: <LayoutGrid size={18} />, label: 'Flow Board' },
  { to: 'govcon-inbox', icon: <Inbox size={18} />, label: 'GovCon Inbox' },
  { to: 'operator-updates', icon: <Radio size={18} />, label: 'Operator Updates' },
  { to: 'ceo-actions', icon: <Activity size={18} />, label: 'CEO Actions' },
  { to: 'proposals', icon: <LayoutGrid size={18} />, label: 'Proposals' },
  { to: 'pricing', icon: <DollarSign size={18} />, label: 'Pricing' },
  { to: 'guides/federal-proposal', icon: <BookOpen size={18} />, label: 'Fed. Guide' },
];

const WALLPAPER_ROTATION_MS = 15 * 60 * 1000;
const desktopWallpapers = [
  '/wallpapers/pf-abstract/pf-01.png',
  '/wallpapers/pf-abstract/pf-02.png',
  '/wallpapers/pf-abstract/pf-03.png',
  '/wallpapers/bing-03.jpg',
  '/wallpapers/bing-06.jpg',
];

const getRandomWallpaperIndex = (excludeIndex = null) => {
  if (desktopWallpapers.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * desktopWallpapers.length);
  while (nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * desktopWallpapers.length);
  }

  return nextIndex;
};

const Layout = ({ children }) => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [activeWallpaperIndex, setActiveWallpaperIndex] = useState(() => getRandomWallpaperIndex());
  // Removed location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWallpaperIndex((current) => getRandomWallpaperIndex(current));
    }, WALLPAPER_ROTATION_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="desktop-shell min-h-screen flex flex-col">
      <div
        className="desktop-wallpaper"
        style={{ backgroundImage: `url("${desktopWallpapers[activeWallpaperIndex]}")` }}
      />
      <div className="desktop-wallpaper-tint" />
      <header className="glass-panel fixed top-0 left-0 right-0 z-50 border-b border-white/30 dark:border-slate-700/40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                className="mr-4 p-2 hover:bg-white/50 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                {isMenuCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
              </button>
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">ProposalFlow</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeSlider />
              <div className="ml-4">
                <AutomationConsole />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`glass-panel fixed inset-y-16 left-0 ${isMenuCollapsed ? 'w-16' : 'w-64'} border-r border-white/30 dark:border-slate-700/40 md:block transform transition-transform duration-200 ease-in-out z-50`}>
        <nav className="flex-1">
          {navigationItems.map((item) => (
            <NavLink
              to={item.to}
              key={item.to}
              className={({ isActive }) =>
                `mx-2 mt-2 flex items-center px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-white/45 dark:hover:bg-slate-800/65 rounded-xl transition-colors ${isActive ? 'bg-white/65 dark:bg-slate-800/85 shadow-sm' : ''}`
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

      <main className="flex-1 pt-16">
        <div className={isMenuCollapsed ? 'ml-16 md:ml-16' : 'ml-64 md:ml-64'}>
          <div className="flex justify-end mb-6 p-4"></div>
          <div className="p-4">
            <div className="desktop-content-frame min-h-[calc(100vh-7rem)] p-4 md:p-6">
            <Outlet />
            {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
