import React, { useState } from 'react';
import { ICONS } from '@/constants';

const MobileFilterToggle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex md:hidden items-center gap-2 w-full px-4 py-3 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 shadow-sm"
      >
        {React.cloneElement(ICONS.search, { className: 'w-4 h-4' })}
        <span>Search & Filter</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className={`${isOpen ? 'block' : 'hidden'} md:block`}>
        {children}
      </div>
    </>
  );
};

export default MobileFilterToggle;
