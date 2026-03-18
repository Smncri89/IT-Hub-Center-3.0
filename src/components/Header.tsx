
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStatus } from '@/types';
import Notifications from './Notifications';
import { ICONS } from '@/constants';
import { useLocalization } from '@/hooks/useLocalization';


const UserMenu: React.FC = () => {
    const { user, logout, status, setUserStatus } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLocalization();

    if (!user) return null;

    const statusClasses: Record<UserStatus, string> = {
        [UserStatus.Online]: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        [UserStatus.Away]: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
        [UserStatus.DoNotDisturb]: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
        [UserStatus.Invisible]: 'bg-neutral-400',
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 group active:scale-95"
            >
                <div className="relative">
                    <img className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-sm" src={user.avatarUrl} alt={user.name} />
                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900 ${statusClasses[status]}`}></span>
                </div>
                <div className="hidden md:block text-left">
                    <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{user.name}</div>
                    <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{user.role}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl py-2 z-50 animate-scaleIn origin-top-right border border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700/50 mb-2">
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                        </div>
                        <div className="px-2">
                            <p className="px-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 mt-1">{t('set status title')}</p>
                            <div className="space-y-1">
                                {Object.values(UserStatus).map((s: UserStatus) => (
                                    <button key={s} onClick={() => { setUserStatus(s); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-xl flex items-center transition-colors gap-3">
                                        <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[s].split(' ')[0]}`}></span>
                                        {s}
                                        {status === s && <svg className="w-4 h-4 text-primary-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-neutral-100 dark:border-neutral-700/50 my-2"></div>
                        <div className="px-2">
                            <button onClick={logout} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-2 transition-colors">
                                {React.cloneElement(ICONS.logout, { className: "h-4 w-4" })}
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const { t } = useLocalization();

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themechange', handleThemeChange);
        return () => window.removeEventListener('themechange', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !document.documentElement.classList.contains('dark');
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('themechange'));
    };

    return (
        <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-all hover:scale-110 active:scale-95 hover:text-primary-600 dark:hover:text-primary-400"
            title={isDark ? t('switch to light mode') : t('switch to dark mode')}
        >
            {isDark ? 
                React.cloneElement(ICONS.sun, { className: "w-5 h-5" }) : 
                React.cloneElement(ICONS.moon, { className: "w-5 h-5" })}
        </button>
    );
};

interface HeaderProps {
    toggleSidebar: () => void;
    isCollapsed: boolean;
    toggleSidebarCollapse: () => void;
    openCommandPalette: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isCollapsed, toggleSidebarCollapse, openCommandPalette }) => {
    const { t } = useLocalization();
    return (
        <header className="sticky top-0 z-30 h-20 glass-header flex items-center justify-between px-6 lg:px-10 flex-shrink-0 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Desktop toggle removed from here */}
                <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6">
                <button
                    onClick={openCommandPalette}
                    className="hidden md:flex items-center gap-3 text-sm py-2.5 px-5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 text-neutral-500 dark:text-neutral-400 w-72 justify-between transition-all group hover:shadow-sm hover:bg-white dark:hover:bg-neutral-800"
                >
                    <div className="flex items-center gap-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {React.cloneElement(ICONS.search, { className: "h-4 w-4"})}
                        <span>{t('search or jump to')}</span>
                    </div>
                    <kbd className="font-sans text-[10px] font-bold bg-white dark:bg-neutral-700 px-2 py-0.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400">⌘K</kbd>
                </button>
                
                <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden md:block"></div>
                
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Notifications />
                </div>
                
                <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden md:block"></div>
                
                <UserMenu />
            </div>
        </header>
    );
};

export default Header;
