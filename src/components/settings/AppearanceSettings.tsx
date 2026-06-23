import React, { useState, useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const ThemeOption: React.FC<{value: string, label: string, currentTheme: string, setTheme: (theme: string) => void}> = ({ value, label, currentTheme, setTheme }) => (
    <label className={`block p-4 border rounded-2xl cursor-pointer transition-all duration-150 ${currentTheme === value ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm'}`}>
        <input type="radio" name="theme" value={value} checked={currentTheme === value} onChange={() => setTheme(value)} className="sr-only" />
        <span className={`font-semibold ${currentTheme === value ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{label}</span>
    </label>
);

const AppearanceSettings: React.FC = () => {
    const { t } = useLocalization();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme]);
    
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'system') {
            setTimeout(() => {
                 if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }, 0);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="border-l-4 border-primary-500 pl-3 text-base font-bold text-neutral-900 dark:text-white">{t('appearance')}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">{t('choose_how_the_app_looks')}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-neutral-700/50 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t('theme')}</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                    <ThemeOption value="light" label={t('light_mode')} currentTheme={theme} setTheme={handleThemeChange} />
                    <ThemeOption value="dark" label={t('dark_mode')} currentTheme={theme} setTheme={handleThemeChange} />
                    <ThemeOption value="system" label={t('system_preference')} currentTheme={theme} setTheme={handleThemeChange} />
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;
