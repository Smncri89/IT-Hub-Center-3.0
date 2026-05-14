
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStatus } from '@/types';
import Notifications from './Notifications';
import { ICONS } from '@/constants';
import { useLocalization } from '@/hooks/useLocalization';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

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
    const isMobile = useIsMobile();

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
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 active:scale-95"
            >
                <div className="relative">
                    <img className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-sm" src={user.avatarUrl} alt={user.name} />
                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900 ${currentStatus.color} ${currentStatus.glow}`}></span>
                </div>
                {!isMobile && (
                    <div className="text-left">
                        <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 leading-tight">{user.name}</div>
                        <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{user.role}</div>
                    </div>
                )}
                {!isMobile && <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-neutral-800 shadow-2xl border border-neutral-200 dark:border-neutral-700"
                        style={isMobile ? {
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            borderRadius: '16px 16px 0 0',
                            animation: 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                        } : {
                            position: 'absolute', top: 64, right: 24,
                            width: 288, borderRadius: 16,
                            animation: 'scaleIn 0.2s ease-out',
                            transformOrigin: 'top right',
                        }}
                    >
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
                            </div>
                        )}

                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700/50 flex items-center gap-3">
                            <img className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900 shadow-md" src={user.avatarUrl} alt={user.name} />
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mt-0.5">{user.role}</p>
                            </div>
                        </div>

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

                        <div className="border-t border-neutral-100 dark:border-neutral-700/50 px-3 py-3">
                            <button
                                onClick={() => { setIsOpen(false); logout(); }}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors"
                            >
                                {React.cloneElement(ICONS.logout, { className: "h-5 w-5" })}
                                {t('logout')}
                            </button>
                        </div>
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
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-all active:scale-95 hover:text-primary-600 dark:hover:text-primary-400"
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
    const isMobile = useIsMobile();

    return (
        <header
            className="sticky top-0 z-30 glass-header flex items-center justify-between flex-shrink-0 shadow-sm"
            style={{ height: isMobile ? 56 : 80, padding: isMobile ? '0 12px' : '0 24px', maxWidth: '100%', overflow: 'visible' }}
        >
            <div className="flex items-center flex-shrink-0">
                <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 active:scale-95">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0" style={{ gap: isMobile ? 4 : 16 }}>
                <button
                    onClick={openCommandPalette}
                    className="p-2 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 active:scale-95 transition-all"
                    style={isMobile ? {} : { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', width: 260 }}
                >
                    <div className="flex items-center gap-2">
                        {React.cloneElement(ICONS.search, { className: "h-4 w-4" })}
                        {!isMobile && <span className="text-sm">{t('search or jump to')}</span>}
                    </div>
                    {!isMobile && <kbd className="ml-auto font-sans text-[10px] font-bold bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-600 text-neutral-400">⌘K</kbd>}
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
