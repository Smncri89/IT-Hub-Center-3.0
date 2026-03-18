import React, { useState, useEffect } from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const ThemeOption: React.FC<{value: string, label: string, currentTheme: string, setTheme: (theme: string) => void}> = ({ value, label, currentTheme, setTheme }) => (
    <label className={`block p-4 border rounded-lg cursor-pointer ${currentTheme === value ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
        <input type="radio" name="theme" value={value} checked={currentTheme === value} onChange={() => setTheme(value)} className="sr-only" />
        <span className="font-semibold">{label}</span>
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
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('appearance')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('choose_how_the_app_looks')}</p>
            <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('theme')}</h3>
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
