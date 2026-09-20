import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, ShieldCheck, User } from 'lucide-react';

const TopBar = ({ isCollapsed, onToggleSidebar, mobileOpen }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md h-16 flex items-center px-4 sm:px-6 transition-all duration-300">
      <div className="flex items-center justify-between w-full">
        
        {/* Left Section: Hamburger & Brand */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar Navigation"
            className="p-2 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer flex items-center justify-center"
            title={mobileOpen ? 'Close Menu' : isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {mobileOpen ? <X className="w-6 h-6 text-amber-400" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md group-hover:scale-105 transition-transform tracking-wider">
              MCQ
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white tracking-wider leading-none">
                  MCQ
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[11px] text-amber-400 font-medium block">
                Daily Preparation Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section: User Profile & Quick Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              {/* Profile Card */}
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center shadow">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-100 truncate max-w-[120px]">
                    {user?.name}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-400 capitalize flex items-center space-x-1">
                    {isAdmin ? (
                      <span className="flex items-center text-purple-400">
                        <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-400">
                        <User className="w-3 h-3 mr-0.5 inline" /> Candidate
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
              >
                Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopBar;
