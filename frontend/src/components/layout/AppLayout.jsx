import React, { useState, useEffect } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Footer from '../Footer';

const AppLayout = ({ children }) => {
  // Initialize desktop sidebar collapse state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch (err) {
      console.error('Failed to save sidebar state:', err);
    }
  }, [isCollapsed]);

  // Handle Hamburger Toggle
  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      {/* Top Header */}
      <TopBar
        isCollapsed={isCollapsed}
        onToggleSidebar={handleToggleSidebar}
        mobileOpen={mobileOpen}
      />

      <div className="flex flex-1 relative pt-16">
        {/* Left Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={handleCloseMobile}
        />

        {/* Main Content Body */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isCollapsed ? 'md:pl-20' : 'md:pl-64'
          }`}
        >
          <main className="flex-1 px-3 sm:px-6 lg:px-8 py-6 max-w-full">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
