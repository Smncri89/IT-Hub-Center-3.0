import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { ICONS, ROLES_PERMISSIONS } from '@/constants';
import { Role } from '@/types';
import { eventBus } from '@/utils/eventBus';

interface Command {
    id: string;
    name: string;
    section: string;
    keywords?: string;
    icon: React.ReactElement<{ className?: string }>;
    action: () => void;
}

const CommandPalette: React.FC<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void }> = ({ isOpen, setIsOpen }) => {
    const { t } = useLocalization();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const inputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themechange', handleThemeChange);
        return () => window.removeEventListener('themechange', handleThemeChange);
    }, []);

    const toggleTheme = useCallback(() => {
        const newIsDark = !document.documentElement.classList.contains('dark');
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('themechange'));
    }, []);

    const commands = useMemo<Command[]>(() => {
        if (!user) return [];
        const userPermissions = ROLES_PERMISSIONS[user.role];
        
        const navCommands: Command[] = [
            { id: 'dashboard', name: t('cmd go to dashboard'), section: 'Navigation', icon: ICONS.dashboard, action: () => navigate('/dashboard') },
            { id: 'tickets', name: t('cmd go to tickets'), section: 'Navigation', icon: ICONS.tickets, action: () => navigate('/tickets') },
            { id: 'assets', name: t('cmd go to assets'), section: 'Navigation', icon: ICONS.assets, action: () => navigate('/assets') },
            { id: 'licenses', name: t('cmd go to licenses'), section: 'Navigation', icon: ICONS.licenses, action: () => navigate('/licenses') },
            { id: 'incidents', name: t('cmd go to incidents'), section: 'Navigation', icon: ICONS.incidents, action: () => navigate('/incidents') },
            { id: 'kb', name: t('cmd go to kb'), section: 'Navigation', icon: ICONS.kb, action: () => navigate('/kb') },
            { id: 'reports', name: t('cmd go to reports'), section: 'Navigation', icon: ICONS.reports, action: () => navigate('/reports') },
            { id: 'settings', name: t('cmd go to settings'), section: 'Navigation', icon: ICONS.settings, action: () => navigate('/settings') },
        ].filter(cmd => userPermissions.includes(cmd.id));

        const actionCommands: Command[] = [
            { id: 'new-ticket', name: t('cmd create new ticket'), section: 'Actions', keywords: 'create', icon: ICONS.plus, action: () => eventBus.emit('openNewTicketModal') },
            { id: 'toggle-theme', name: t('cmd toggle theme'), section: 'Actions', keywords: 'dark light mode appearance', icon: isDark ? ICONS.sun : ICONS.moon, action: toggleTheme },
            { id: 'logout', name: t('cmd logout'), section: 'Actions', keywords: 'sign out exit', icon: ICONS.logout, action: logout },
        ];
        
        return [...navCommands, ...actionCommands];
    }, [user, t, navigate, logout, toggleTheme, isDark]);

    const filteredCommands = useMemo(() => {
        if (!searchQuery) return commands;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return commands.filter(cmd => 
            cmd.name.toLowerCase().includes(lowerCaseQuery) ||
            (cmd.keywords && cmd.keywords.toLowerCase().includes(lowerCaseQuery))
        );
    }, [searchQuery, commands]);

    const groupedCommands = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            (acc[cmd.section] = acc[cmd.section] || []).push(cmd);
            return acc;
        }, {} as Record<string, Command[]>);
    }, [filteredCommands]);
    
    const flatFilteredCommands = useMemo(() => Object.values(groupedCommands).flat(), [groupedCommands]);

    const closePalette = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);
    
    useEffect(() => {
        if (isOpen) {
            // Focus input when opened
            inputRef.current?.focus();
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsOpen(true);
            }
            if (isOpen) {
                if (event.key === 'Escape') {
                    closePalette();
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % flatFilteredCommands.length);
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + flatFilteredCommands.length) % flatFilteredCommands.length);
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    if (flatFilteredCommands[selectedIndex]) {
                        flatFilteredCommands[selectedIndex].action();
                        closePalette();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePalette, flatFilteredCommands, selectedIndex, setIsOpen]);
    
     useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    if (!isRendered) return null;

    return (
        <div 
            className={`fixed inset-0 bg-black z-40 flex justify-center items-start pt-20 sm:pt-32 transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`}
            onClick={closePalette}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className={`bg-white dark:bg-neutral-800 rounded-lg shadow-2xl w-full max-w-xl transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        {React.cloneElement(ICONS.search, { className: 'h-5 w-5' })}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={t('type a command')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent p-4 pl-12 text-base text-neutral-800 dark:text-neutral-100 focus:outline-none"
                    />
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 max-h-96 overflow-y-auto">
                    {flatFilteredCommands.length > 0 ? (
                        <ul>
                            {Object.entries(groupedCommands).map(([section, cmds]: [string, Command[]]) => (
                                <li key={section}>
                                    <h3 className="text-xs font-semibold text-neutral-500 px-4 pt-3 pb-1">{section}</h3>
                                    <ul>
                                        {cmds.map((cmd, i) => {
                                            const globalIndex = flatFilteredCommands.findIndex(c => c.id === cmd.id);
                                            return (
                                            <li
                                                key={cmd.id}
                                                onClick={() => { cmd.action(); closePalette(); }}
                                                className={`flex items-center justify-between gap-2 p-3 mx-2 my-1 rounded-md cursor-pointer ${selectedIndex === globalIndex ? 'bg-primary-500 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                                            >
                                                <div className={`flex items-center gap-3 ${selectedIndex === globalIndex ? '' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                    <div className="w-5 h-5">{React.cloneElement(cmd.icon, { className: 'w-5 h-5' })}</div>
                                                    <span>{cmd.name}</span>
                                                </div>
                                            </li>
                                        )})}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-8 text-center text-neutral-500">{t('no results found')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;