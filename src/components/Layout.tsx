
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocalization } from '@/hooks/useLocalization';
import CommandPalette from './CommandPalette';
import AIAssistant from './AIAssistant';
import PWAInstallBanner from './PWAInstallBanner';

const Footer: React.FC = () => {
  const { t } = useLocalization();
  return (
    <footer className="py-6 px-8 text-center text-xs font-medium text-neutral-400 dark:text-neutral-600 space-y-1 mt-auto">
      <p>{t('copyright notice')}</p>
      <p className="opacity-75">{t('developed by')}</p>
    </footer>
  );
};

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-primary-500/30 overflow-hidden relative">
      
      {/* Premium Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary-100/40 via-neutral-50/20 to-transparent dark:from-primary-900/20 dark:via-neutral-950/40 dark:to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out z-10 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <Header 
          toggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          toggleSidebarCollapse={toggleSidebarCollapse}
          openCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* FIX: Removed overflow-x-hidden to allow tables to scroll horizontally if needed, improving responsiveness on smaller screens */}
          <main key={location.pathname} className="flex-1 flex flex-col overflow-y-auto scroll-smooth custom-scrollbar">
            <div className="w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 flex-grow animate-fade-in flex flex-col">
              <PWAInstallBanner />
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </div>
      <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
      <AIAssistant />
    </div>
  );
};

export default Layout;
