
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStatus } from '@/types';
import Notifications from './Notifications';
import { ICONS } from '@/constants';
import { useLocalization } from '@/hooks/useLocalization';

const statusConfig: Record<UserStatus, { color: string; glow: string; label: string }> = {
    [UserStatus.Online]: { color: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]', label: 'Online' },
    [UserStatus.Away]: { color: 'bg-amber-500', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]', label: 'Away' },
    [UserStatus.DoNotDisturb]: { color: 'bg-rose-500', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.6)]', label: 'Do Not Disturb' },
    [UserStatus.Invisible]: { color: 'bg-neutral-400', glow: '', label: 'Invisible' },
};

const UserMenu: React.FC = () => {
    const { user, logout, status, setUserStatus } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLocalization();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!user) return null;

    const currentStatus = statusConfig[status];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 active:scale-95"
            >
                <div className="relative">
                    <img className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-sm" src={user.avatarUrl} alt={user.name} />
                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900 ${currentStatus.color} ${currentStatus.glow}`}></span>
                </div>
                <div className="hidden md:block text-left">
                    <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 leading-tight">{user.name}</div>
                    <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{user.role}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-neutral-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Bottom sheet on mobile, dropdown on desktop */}
                    <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-16 md:right-6 md:left-auto md:w-72 bg-white dark:bg-neutral-800 md:rounded-2xl rounded-t-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 animate-sheet-up md:animate-scale-in md:origin-top-right">

                        {/* Drag handle (mobile only) */}
                        <div className="flex justify-center pt-3 pb-1 md:hidden">
                            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
                        </div>

                        {/* User info */}
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700/50 flex items-center gap-3">
                            <img className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900 shadow-md" src={user.avatarUrl} alt={user.name} />
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mt-0.5">{user.role}</p>
                            </div>
                        </div>

                        {/* Status options */}
                        <div className="px-3 py-3">
                            <p className="px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{t('set status title')}</p>
                            <div className="space-y-0.5">
                                {Object.values(UserStatus).map((s: UserStatus) => {
                                    const cfg = statusConfig[s];
                                    const isActive = status === s;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => { setUserStatus(s); setIsOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm rounded-xl flex items-center transition-all gap-3 ${
                                                isActive
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                                                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                                            }`}
                                        >
                                            <span className={`h-3 w-3 rounded-full ${cfg.color} ${isActive ? cfg.glow : ''}`}></span>
                                            <span className="flex-1">{cfg.label}</span>
                                            {isActive && (
                                                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-neutral-100 dark:border-neutral-700/50 px-3 py-3">
                            <button
                                onClick={() => { setIsOpen(false); logout(); }}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors"
                            >
                                {React.cloneElement(ICONS.logout, { className: "h-5 w-5" })}
                                {t('logout')}
                            </button>
                        </div>

                        {/* Safe area spacer for mobile */}
                        <div className="h-2 md:hidden"></div>
                    </div>
                </div>
            )}
        </>
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
            className="p-2 sm:p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-all active:scale-95 hover:text-primary-600 dark:hover:text-primary-400"
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
        <header className="sticky top-0 z-30 h-14 md:h-20 glass-header flex items-center justify-between px-3 md:px-6 lg:px-10 flex-shrink-0 transition-all duration-300 shadow-sm min-w-0">
            <div className="flex items-center flex-shrink-0">
                <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 active:scale-95">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
                <button
                    onClick={openCommandPalette}
                    className="p-2 md:flex md:items-center md:gap-2 md:text-sm md:py-2 md:px-4 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 text-neutral-500 dark:text-neutral-400 md:w-64 lg:w-72 md:justify-between transition-all group hover:shadow-sm hover:bg-white dark:hover:bg-neutral-800 active:scale-95"
                >
                    <div className="flex items-center gap-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {React.cloneElement(ICONS.search, { className: "h-4 w-4" })}
                        <span className="hidden md:inline text-sm">{t('search or jump to')}</span>
                    </div>
                    <kbd className="hidden lg:inline font-sans text-[10px] font-bold bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500">⌘K</kbd>
                </button>

                <div className="flex items-center">
                    <ThemeToggle />
                    <Notifications />
                </div>

                <UserMenu />
            </div>
        </header>
    );
};

export default Header;
