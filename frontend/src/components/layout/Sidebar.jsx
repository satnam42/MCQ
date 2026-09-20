import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Target,
  BookOpen,
  Award,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  HelpCircle,
  FolderTree,
  PlusCircle,
  Upload,
  Trash2,
  LineChart,
  History,
  RotateCcw,
  LayoutDashboard,
  ShieldAlert,
  Lock,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

const Sidebar = ({ isCollapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const handleLogout = () => {
    logout();
    onCloseMobile();
    navigate('/login');
  };

  // Helper to check active state
  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  // Common User Menu Items
  const userMenuItems = [
    { label: 'Home', icon: Home, path: '/dashboard', permission: 'HOME_VIEW' },
    { label: 'Practice', icon: Target, path: '/practice-session', permission: 'PRACTICE_VIEW' },
    { label: 'Topics', icon: BookOpen, path: '/topic-practice', permission: 'TOPICS_VIEW' },
    { label: 'Daily Test', icon: Award, path: '/daily-quiz', permission: 'DAILY_TEST_VIEW' },
    { label: 'Notes', icon: FileText, path: '/study-notes', isGurmukhi: true, permission: 'NOTES_VIEW' },
    { label: 'My Progress', icon: BarChart2, path: '/progress', permission: 'MY_PROGRESS_VIEW' },
    { label: 'Settings', icon: Settings, path: '/settings', permission: 'SETTINGS_VIEW' },
  ];

  // Quick Candidate Practice Links
  const quickCandidateItems = [
    { label: 'Test History', icon: History, path: '/history', permission: 'TEST_HISTORY_VIEW' },
    { label: 'Re-attempt Mistakes', icon: RotateCcw, path: '/reattempt-incorrect', accent: 'rose', permission: 'REATTEMPT_VIEW' },
  ];

  // Admin Only Management Menu Items
  const adminMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', permission: 'HOME_VIEW' },
    { label: 'Manage Users', icon: Users, path: '/admin/users', permission: 'MANAGE_USERS' },
    { label: 'Manage Questions', icon: HelpCircle, path: '/admin/questions', permission: 'MANAGE_QUESTIONS' },
    { label: 'Manage Topics', icon: FolderTree, path: '/admin/topics', permission: 'MANAGE_TOPICS' },
    { label: 'Add Questions', icon: PlusCircle, path: '/admin/ai-generator', permission: 'ADD_QUESTIONS' },
    { label: 'Bulk Import Questions', icon: Upload, path: '/admin/import', permission: 'BULK_IMPORT' },
    { label: 'Manage/Delete Questions', icon: Trash2, path: '/admin/questions?mode=delete', permission: 'DELETE_QUESTIONS' },
    { label: 'Admin Analytics', icon: LineChart, path: '/admin/analytics', permission: 'ADMIN_ANALYTICS' },
    { label: 'Manage Notes', icon: ShieldAlert, path: '/admin/notes', permission: 'MANAGE_NOTES' },
    { label: 'Permissions', icon: Lock, path: '/admin/permissions', permission: 'MANAGE_PERMISSIONS' },
    { label: 'Test Limits', icon: Sliders, path: '/admin/test-limits', permission: 'MANAGE_TEST_LIMITS' },
    { label: 'User Test Limits', icon: UserCheck, path: '/admin/user-limits', permission: 'MANAGE_USER_LIMITS' },
  ];

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    let activeClasses = 'text-slate-300 hover:bg-slate-800 hover:text-white';
    if (active) {
      if (item.accent === 'rose') {
        activeClasses = 'bg-rose-500/20 text-rose-300 font-bold border-r-4 border-rose-500';
      } else if (item.isAdmin) {
        activeClasses = 'bg-purple-500/20 text-purple-300 font-bold border-r-4 border-purple-500';
      } else {
        activeClasses = 'bg-amber-500/20 text-amber-400 font-bold border-r-4 border-amber-500';
      }
    }

    return (
      <Link
        key={item.path + item.label}
        to={item.path}
        onClick={onCloseMobile}
        className={`group relative flex items-center px-3 py-2.5 my-0.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${activeClasses}`}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'}`} />
        
        {/* Menu Text Label: Always visible on mobile, conditional on desktop */}
        <span
          className={`ml-3 truncate ${item.isGurmukhi ? 'font-gurmukhi' : ''} ${
            isCollapsed ? 'block md:hidden' : 'block'
          }`}
        >
          {item.label}
        </span>

        {/* Floating Tooltip ONLY for Desktop Collapsed Mode */}
        {isCollapsed && (
          <div className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-amber-300 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-800">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Responsive: Mobile Drawer & Desktop Fixed) */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 md:z-20 bg-slate-900 border-r border-slate-800 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
          ${/* Mobile drawer positioning & width */ ''}
          ${mobileOpen ? 'translate-x-0 w-[280px] max-w-[85vw] sm:w-72 md:w-auto' : '-translate-x-full md:translate-x-0'}
          ${/* Desktop top offset (top-16) vs Mobile full height (top-0) */ ''}
          md:top-16
          ${/* Desktop collapsed width vs expanded width */ ''}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Mobile Header with Close X Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 md:hidden bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              MCQ
            </div>
            <span className="font-extrabold text-white text-base tracking-wider">Navigation</span>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Section 1: Main User Navigation */}
          <div>
            <div className={`px-3 mb-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase ${isCollapsed ? 'block md:hidden' : 'block'}`}>
              Main Menu
            </div>
            <nav className="space-y-0.5">
              {userMenuItems.filter(item => hasPermission(item.permission)).map((item) => renderMenuItem(item))}
            </nav>
          </div>

          {/* Section 2: Quick Practice & History */}
          <div>
            <div className={`px-3 mb-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase ${isCollapsed ? 'block md:hidden' : 'block'}`}>
              Practice & History
            </div>
            <nav className="space-y-0.5">
              {quickCandidateItems.filter(item => hasPermission(item.permission)).map((item) => renderMenuItem(item))}
            </nav>
          </div>

          {/* Section 3: Admin Management (RENDERED ONLY WHEN USER IS ADMIN) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className={`px-3 mb-2 items-center justify-between text-[10px] font-extrabold tracking-wider text-purple-400 uppercase ${isCollapsed ? 'flex md:hidden' : 'flex'}`}>
                <span>Admin Management</span>
                <span className="px-1.5 py-0.2 bg-purple-900/50 text-purple-300 rounded text-[9px]">Portal</span>
              </div>
              <nav className="space-y-0.5">
                {adminMenuItems.filter(item => hasPermission(item.permission)).map((item) =>
                  renderMenuItem({ ...item, isAdmin: true })
                )}
              </nav>
            </div>
          )}

        </div>

        {/* Sidebar Footer: User Card & Collapse Toggle Button */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex flex-col space-y-2">
          
          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer group ${
              isCollapsed ? 'justify-start md:justify-center' : 'justify-start'
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className={`ml-3 truncate ${isCollapsed ? 'block md:hidden' : 'block'}`}>Logout</span>
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden md:flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
