import React from 'react';
import { Link } from 'react-router-dom';

interface QuickActionButtonProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  to: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, to }) => {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center justify-center p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-md hover:shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-200 group"
    >
      <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-full text-primary-600 dark:text-primary-300 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { className: "h-8 w-8" })}
      </div>
      <span className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</span>
    </Link>
  );
};

export default QuickActionButton;