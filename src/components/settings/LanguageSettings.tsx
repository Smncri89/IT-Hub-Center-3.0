import React from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { Language } from '@/types';
import { FLAGS } from '@/constants';

const LanguageSettings: React.FC = () => {
  const { t, language, setLanguage } = useLocalization();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('settings_language')}</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6">{t('settings_language_desc')}</p>
      
      <div className="space-y-3">
        {(Object.keys(Language) as Language[]).map(lang => (
          <label 
            key={lang} 
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${language === lang ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500'}`}
          >
            <input 
              type="radio" 
              name="language" 
              value={lang} 
              checked={language === lang} 
              onChange={() => setLanguage(lang)} 
              className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500" 
            />
            <div className="ml-4 flex items-center">
              <div className="w-6 h-6 rounded-full overflow-hidden mr-3">{FLAGS[lang]}</div>
              <span className="font-medium">{t(`lang_${lang}`)}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LanguageSettings;
