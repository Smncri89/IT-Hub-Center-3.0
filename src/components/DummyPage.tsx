import React from 'react';
import { useLocalization } from '@/hooks/useLocalization';

interface DummyPageProps {
  titleKey: string;
}

const DummyPage: React.FC<DummyPageProps> = ({ titleKey }) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8 text-center">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">{t(titleKey)}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        {t('feature in development')}
      </p>
      <div className="mt-8 text-6xl animate-pulse">⚙️</div>
    </div>
  );
};

export default DummyPage;
