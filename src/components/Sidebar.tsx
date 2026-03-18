
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import { ICONS, ROLES_PERMISSIONS, Logo, FLAGS } from '@/constants';
import { Role, Language } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleSidebarCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleSidebarCollapse }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLocalization();
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const userRole = user?.role || Role.EndUser;
  const permissions = ROLES_PERMISSIONS[userRole];
  const isAdminOrAgent = userRole === Role.Admin || userRole === Role.Agent;

  const navItems = [
    { id: 'dashboard', labelKey: 'dashboard', icon: ICONS.dashboard, path: '/dashboard' },
    { id: 'tickets', labelKey: 'tickets', icon: ICONS.tickets, path: '/tickets' },
    { id: 'assets', labelKey: 'assets', icon: ICONS.assets, path: '/assets' },
    { id: 'licenses', labelKey: 'licenses', icon: ICONS.licenses, path: '/licenses' },
    { id: 'incidents', labelKey: 'incidents', icon: ICONS.incidents, path: '/incidents' },
    { id: 'session', labelKey: 'session', icon: ICONS.session, path: '/session' },
    { id: 'reports', labelKey: 'reports', icon: ICONS.reports, path: '/reports' },
    { id: 'kb', labelKey: 'kb', icon: ICONS.kb, path: '/kb' },
  ];
  
  // Removed 'map' from extraItems as it is now integrated into AssetsList
  const extraItems = isAdminOrAgent ? [
      { id: 'vendors', labelKey: 'Vendors', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, path: '/vendors' },
  ] : [];

  const allowedNavItems = navItems.filter(item => permissions.includes(item.id));

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={toggleSidebar}
      ></div>

      <aside className={`fixed top-0 left-0 h-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-r border-neutral-200 dark:border-neutral-800 z-40 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-72'} shadow-lg`}>
        
        {/* Collapse Button (Desktop Only) */}
        <button
            onClick={toggleSidebarCollapse}
            className="absolute -right-3 top-9 hidden lg:flex items-center justify-center w-6 h-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full text-neutral-500 dark:text-neutral-400 shadow-md hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 transition-all z-50"
            title={t(isCollapsed ? 'expand sidebar' : 'collapse sidebar')}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        <div className={`flex items-center h-20 px-6 flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
                <div className="absolute inset-0 bg-primary-500 blur-lg opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform ring-1 ring-white/10">
                    <Logo className="h-6 w-6 text-white" />
                </div>
            </div>
            <span className={`font-bold text-xl tracking-tight text-neutral-900 dark:text-white transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                IT Hub Center
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          <p className={`px-4 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 text-center' : 'opacity-100'}`}>Menu</p>
          <ul>
            {[...allowedNavItems, ...extraItems].map(item => (
              <li key={item.id}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `
                    flex items-center px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300 shadow-sm ring-1 ring-primary-200 dark:ring-primary-500/20' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }
                    ${isCollapsed ? 'justify-center px-0' : ''}
                  `}
                  title={isCollapsed ? (t(item.labelKey) === item.labelKey ? item.labelKey : t(item.labelKey)) : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !isCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full"></div>}
                      <div className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                        {React.cloneElement(item.icon, { className: "w-[20px] h-[20px]" })}
                      </div>
                      <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t(item.labelKey) === item.labelKey ? item.labelKey : t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800 space-y-2 bg-neutral-50/80 dark:bg-neutral-900/30 backdrop-blur-md">
            <div className="relative">
                <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className={`flex items-center w-full p-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm hover:text-neutral-900 dark:hover:text-neutral-200 transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 ${isCollapsed ? 'justify-center' : ''}`}
                    title={t('language')}
                >
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700 transition-all">{FLAGS[language]}</div>
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t(`lang ${language}`)}</span>
                    {!isCollapsed && <svg xmlns="http://www.w3.org/2000/svg" className={`ml-auto h-4 w-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                </button>
                {isLangOpen && (
                    <div className={`absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden z-50 animate-scaleIn origin-bottom ${isCollapsed ? 'left-full ml-4 bottom-0 w-48' : ''}`}>
                        {(Object.keys(Language) as Language[]).map(lang => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className="flex items-center w-full p-3 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 shadow-sm mr-3 ring-1 ring-neutral-200 dark:ring-neutral-600">{FLAGS[lang]}</div>
                                <span className={`whitespace-nowrap font-medium ${language === lang ? 'text-primary-600 dark:text-primary-400' : ''}`}>{t(`lang ${lang}`)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {permissions.includes('settings') && (
              <NavLink 
                to="/settings"
                className={({ isActive }) => `
                    flex items-center p-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isActive 
                        ? 'bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200 hover:shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                `}
                title={t('settings')}
              >
                 {({ isActive }) => (
                    <>
                      <div className={`flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                        {React.cloneElement(ICONS.settings, { className: "w-5 h-5" })}
                      </div>
                      <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t('settings')}</span>
                    </>
                  )}
              </NavLink>
            )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
