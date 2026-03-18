import React from 'react';
import { useLocalization } from '@/hooks/useLocalization';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const { t } = useLocalization();
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex justify-center items-center p-8`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-primary-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={t('loading')}
      >
        <span className="sr-only">{t('loading')}</span>
      </div>
    </div>
  );
};

export default Spinner;