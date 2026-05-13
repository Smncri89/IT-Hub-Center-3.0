import React from 'react';
import { Settings } from 'lucide-react';
import { Role, Language, TicketStatus, TicketPriority } from '@/types';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 52 52" 
      className={className} 
      aria-label="IT Hub Center Logo"
    >
      <defs>
        <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="48" height="48" rx="14" ry="14" fill="url(#logoGrad1)" />
      <rect x="4" y="4" width="44" height="44" rx="12" ry="12" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="26" cy="26" r="7" fill="url(#logoGrad2)" />
      <line x1="26" y1="19" x2="26" y2="11" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="33" x2="26" y2="41" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="26" x2="11" y2="26" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="26" x2="41" y2="26" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="21.05" y1="21.05" x2="15" y2="15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30.95" y1="21.05" x2="37" y2="15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21.05" y1="30.95" x2="15" y2="37" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30.95" y1="30.95" x2="37" y2="37" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="10" r="3.5" fill="white" fillOpacity="0.9" />
      <circle cx="26" cy="42" r="3.5" fill="white" fillOpacity="0.9" />
      <circle cx="10" cy="26" r="3.5" fill="white" fillOpacity="0.9" />
      <circle cx="42" cy="26" r="3.5" fill="white" fillOpacity="0.9" />
      <circle cx="14" cy="14" r="2.5" fill="white" fillOpacity="0.6" />
      <circle cx="38" cy="14" r="2.5" fill="white" fillOpacity="0.6" />
      <circle cx="14" cy="38" r="2.5" fill="white" fillOpacity="0.6" />
      <circle cx="38" cy="38" r="2.5" fill="white" fillOpacity="0.6" />
    </svg>
);

export const FLAGS = {
  [Language.en]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
      <defs><clipPath id="a"><path d="M18 18m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0"/></clipPath></defs>
      <g clipPath="url(#a)">
        <path fill="#00247d" d="M0 0h36v36H0z"/>
        <path fill="#fff" d="M36 0L0 36V0h36zM0 0l36 36V0H0z"/>
        <path stroke="#cf142b" strokeWidth="3.6" d="M36 0L0 36M0 0l36 36"/>
        <path fill="#fff" d="M14.4 0H21.6V36H14.4zM0 14.4H36V21.6H0z"/>
        <path fill="#cf142b" d="M16.2 0h3.6v36h-3.6zM0 16.2H36v3.6H0z"/>
      </g>
    </svg>
  ),
  [Language.it]: (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
      <defs><clipPath id="b"><path d="M18 18m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0"/></clipPath></defs>
      <g clipPath="url(#b)">
        <path fill="#009246" d="M0 0h12v36H0z"/>
        <path fill="#fff" d="M12 0h12v36H12z"/>
        <path fill="#ce2b37" d="M24 0h12v36H24z"/>
      </g>
    </svg>
  ),
  [Language.es]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
      <defs><clipPath id="c"><path d="M18 18m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0"/></clipPath></defs>
      <g clipPath="url(#c)">
        <path fill="#c60b1e" d="M0 0h36v36H0z"/>
        <path fill="#ffc400" d="M0 9h36v18H0z"/>
      </g>
    </svg>
  )
};

export const ICONS = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  sparkle_chat: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  sparkle: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  refresh: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.634 2.333l-3.182-3.182m0-4.308v-4.992m0 0h-4.992m4.992 0l-3.182-3.182a8.25 8.25 0 00-11.634-2.333l3.181 3.183" /></svg>,
  checkout: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>,
  checkin: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3 0l-3-3m0 0l-3 3m3-3V9" /></svg>,
  laptop: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>,
  integrations: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25z" /></svg>,
  eye_open: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  eye_closed: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>,
  sun: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
  moon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
  expand_sidebar: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>,
  collapse_sidebar: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  tickets: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
  assets: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  licenses: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>,
  incidents: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
  session: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>,
  kb: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  settings: <Settings strokeWidth={1.5} />,
  logout: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
  upload: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l4.5-4.5m-4.5 4.5l-4.5-4.5m4.5 4.5v-10.5" /></svg>,
  plus: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  file: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  delete: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  archive: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  chart_pie: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>,
  chart_bar: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  profile: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  sla: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  security: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  language: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.625M21 21l-5.25-11.625M3.75 5.25h16.5M4.5 12h15M5.25 18.75h13.5" /></svg>,
  database: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
  paperclip: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  building: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  vendor: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>,
  onboarding: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  audit: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.251 2.251 0 011.65 1.608m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
  app: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>,
  warranty: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  close: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  alert_circle: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
  printer: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>,
  key: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  code: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
  question: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>,
  map: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0l-3 3m3-3l3 3m-8.25 0h13.5A2.25 2.25 0 0021 15.75V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v9a2.25 2.25 0 002.25 2.25z" /></svg>,
};export const ROLES_PERMISSIONS: Record<Role, string[]> = {
  [Role.Admin]: ['dashboard', 'tickets', 'assets', 'licenses', 'incidents', 'session', 'reports', 'kb', 'settings', 'vendors', 'map'],
  [Role.Agent]: ['dashboard', 'tickets', 'assets', 'licenses', 'incidents', 'session', 'reports', 'kb', 'settings', 'vendors', 'map'],
  [Role.Member]: ['dashboard', 'tickets', 'assets', 'licenses', 'kb', 'settings'],
  [Role.EndUser]: ['dashboard', 'tickets', 'kb', 'settings'],
};

export const TICKET_CATEGORIES = {
  'Hardware': ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Peripherals'],
  'Software': ['OS', 'Office Suite', 'Development Tools', 'Design Tools', 'Other'],
  'Network': ['WiFi', 'VPN', 'Internet Access', 'Firewall'],
  'Access': ['Password Reset', 'New Account', 'Permissions', 'MFA'],
  'Other': ['General Inquiry', 'Feedback'],
};

export const STATUS_COLORS: Record<string, string> = {
  [TicketStatus.Open]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  [TicketStatus.InProgress]: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  [TicketStatus.Resolved]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [TicketStatus.Closed]: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-400',
  'In Use': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Ready to Deploy': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'In Stock': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Archived': 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-400',
  'Broken - Not Fixable': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Lost/Stolen': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Out for Diagnostics': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Out for Repair': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  [TicketPriority.Urgent]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-500/30',
  [TicketPriority.High]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 ring-1 ring-yellow-500/30',
  [TicketPriority.Medium]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-500/30',
  [TicketPriority.Low]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 ring-1 ring-gray-500/30',
};

export const INCIDENT_STATUS_COLORS: Record<string, string> = {
    'Investigating': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Identified': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Monitoring': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export const INCIDENT_CATEGORY_COLORS: Record<string, string> = {
    'Network': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Security Breach': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Data Loss': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    'Performance Degradation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Service Outage': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Software': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Hardware': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    'Password Reset': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const ASSET_IMAGE_LIBRARY: Record<string, { label: string, url: string, keywords: string[] }> = {
    // ── Apple Mac ────────────────────────────────────────────────────────
    'macbook_pro': { label: 'MacBook Pro', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=300&q=80', keywords: ['macbook pro', 'apple', 'm1 pro', 'm2 pro', 'm3 pro', 'm4 pro', 'm1 max', 'm2 max', 'm3 max', 'm4 max'] },
    'macbook_air': { label: 'MacBook Air', url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80', keywords: ['macbook air', 'apple', 'm1', 'm2', 'm3', 'm4', 'ultrabook'] },
    'imac': { label: 'iMac', url: 'https://images.unsplash.com/photo-1621318697398-4db37373a278?auto=format&fit=crop&w=300&q=80', keywords: ['imac', 'apple', 'all-in-one', 'retina'] },
    'mac_mini': { label: 'Mac Mini', url: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=300&q=80', keywords: ['mac mini', 'apple', 'mini pc'] },
    'mac_studio': { label: 'Mac Studio', url: 'https://images.unsplash.com/photo-1647225733643-06407331bf44?auto=format&fit=crop&w=300&q=80', keywords: ['mac studio', 'apple', 'ultra', 'pro studio'] },
    'mac_pro': { label: 'Mac Pro', url: 'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?auto=format&fit=crop&w=300&q=80', keywords: ['mac pro', 'apple', 'tower', 'rack'] },
    // ── Dell ─────────────────────────────────────────────────────────────
    'dell_latitude': { label: 'Dell Latitude', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80', keywords: ['latitude', 'latitude 3', 'latitude 5', 'latitude 7', 'latitude 9', '3440', '3540', '3550', '3560', '5440', '5540', '5550', '5560', '7440', '7450', '7540', '7640', '9440', '9450'] },
    'dell_xps': { label: 'Dell XPS', url: 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&w=300&q=80', keywords: ['dell xps', 'xps 13', 'xps 14', 'xps 15', 'xps 16', '9500', '9510', '9520', '9530', '9310', '9315', '9320', '9340', '9345'] },
    'dell_inspiron': { label: 'Dell Inspiron', url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=300&q=80', keywords: ['inspiron', 'inspiron 14', 'inspiron 15', 'inspiron 16', '3520', '3530', '5620', '5630', '7620', '7630'] },
    'dell_vostro': { label: 'Dell Vostro', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80', keywords: ['vostro', 'vostro 14', 'vostro 15', 'vostro 16', '3520', '3530', '5620', '5630'] },
    'dell_precision': { label: 'Dell Precision', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=300&q=80', keywords: ['precision', 'precision 3', 'precision 5', 'precision 7', '3580', '3581', '5570', '5680', '7770', '7780', 'mobile workstation'] },
    'dell_optiplex': { label: 'Dell OptiPlex', url: 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?auto=format&fit=crop&w=300&q=80', keywords: ['optiplex', 'optiplex 3', 'optiplex 5', 'optiplex 7', '3000', '5000', '7000', '7010', '7020', 'micro', 'sff', 'tower', 'mff'] },
    // ── Lenovo ───────────────────────────────────────────────────────────
    'thinkpad_x1': { label: 'Lenovo ThinkPad X1', url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=300&q=80', keywords: ['thinkpad x1', 'x1 carbon', 'x1 yoga', 'x1 nano', 'x1 extreme', 'x1 titanium'] },
    'thinkpad': { label: 'Lenovo ThinkPad', url: 'https://images.unsplash.com/photo-1630794180018-433d915c34ac?auto=format&fit=crop&w=300&q=80', keywords: ['thinkpad', 'thinkpad l', 'thinkpad t', 'thinkpad e', 'thinkpad p', 'l14', 'l15', 'l16', 't14', 't14s', 't16', 'e14', 'e15', 'e16', 'p14s', 'p16s', 'p16', 'p1'] },
    'lenovo_ideapad': { label: 'Lenovo IdeaPad', url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80', keywords: ['ideapad', 'ideapad slim', 'ideapad flex', 'ideapad 3', 'ideapad 5', 'ideapad pro'] },
    'lenovo_thinkbook': { label: 'Lenovo ThinkBook', url: 'https://images.unsplash.com/photo-1602080858428-57174f9431cf?auto=format&fit=crop&w=300&q=80', keywords: ['thinkbook', 'thinkbook 14', 'thinkbook 15', 'thinkbook 16', 'thinkbook plus'] },
    'lenovo_thinkcentre': { label: 'Lenovo ThinkCentre', url: 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?auto=format&fit=crop&w=300&q=80', keywords: ['thinkcentre', 'thinkcentre m', 'thinkcentre neo', 'tiny', 'lenovo desktop'] },
    'lenovo_legion': { label: 'Lenovo Legion', url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=300&q=80', keywords: ['legion', 'legion 5', 'legion 7', 'legion pro', 'gaming lenovo'] },
    // ── HP ───────────────────────────────────────────────────────────────
    'hp_elitebook': { label: 'HP EliteBook', url: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=300&q=80', keywords: ['elitebook', 'elitebook 840', 'elitebook 850', 'elitebook 860', 'elitebook 640', 'elitebook 650', 'elitebook 630', 'g9', 'g10', 'g11'] },
    'hp_probook': { label: 'HP ProBook', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80', keywords: ['probook', 'probook 440', 'probook 450', 'probook 640', 'probook 650', 'probook 430'] },
    'hp_zbook': { label: 'HP ZBook', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80', keywords: ['zbook', 'zbook fury', 'zbook firefly', 'zbook power', 'zbook studio', 'hp workstation'] },
    'hp_spectre': { label: 'HP Spectre x360', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=300&q=80', keywords: ['spectre', 'spectre x360', 'hp envy', 'envy x360'] },
    'hp_pavilion': { label: 'HP Pavilion', url: 'https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=300&q=80', keywords: ['pavilion', 'hp pavilion', 'pavilion 14', 'pavilion 15', 'pavilion x360'] },
    'hp_elite_desktop': { label: 'HP Elite Desktop', url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=300&q=80', keywords: ['hp elite', 'elitedesk', 'elite tower', 'elite mini', 'elite sff', 'prodesk', 'hp desktop'] },
    // ── Microsoft Surface ────────────────────────────────────────────────
    'surface_laptop': { label: 'Surface Laptop', url: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=300&q=80', keywords: ['surface laptop', 'surface laptop go', 'surface laptop studio', 'microsoft laptop'] },
    'surface_pro': { label: 'Surface Pro', url: 'https://images.unsplash.com/photo-1542393545-facac42e67ee?auto=format&fit=crop&w=300&q=80', keywords: ['surface pro', 'surface go', 'microsoft tablet', 'surface tablet'] },
    // ── ASUS ─────────────────────────────────────────────────────────────
    'asus_laptop': { label: 'ASUS Laptop', url: 'https://images.unsplash.com/photo-1600267185393-e158a98703de?auto=format&fit=crop&w=300&q=80', keywords: ['asus', 'vivobook', 'zenbook', 'expertbook', 'rog', 'tuf', 'proart'] },
    // ── Acer ─────────────────────────────────────────────────────────────
    'acer_laptop': { label: 'Acer Laptop', url: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=300&q=80', keywords: ['acer', 'aspire', 'swift', 'spin', 'travelmate', 'nitro', 'predator', 'chromebook'] },
    // ── Generic PC / Desktop ─────────────────────────────────────────────
    'pc_tower': { label: 'PC Tower / Workstation', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=300&q=80', keywords: ['tower', 'desktop pc', 'workstation', 'custom pc', 'gaming pc', 'mini pc', 'nuc', 'intel nuc', 'beelink'] },
    'generic_laptop': { label: 'Laptop generico', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80', keywords: ['notebook', 'laptop', 'portatile', 'computer portatile'] },
    // ── Smartphone ───────────────────────────────────────────────────────
    'iphone_pro': { label: 'iPhone Pro', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80', keywords: ['iphone 16', 'iphone 15', 'iphone 14', 'iphone pro', 'iphone pro max', 'iphone plus'] },
    'iphone': { label: 'iPhone', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80', keywords: ['iphone', 'iphone 13', 'iphone 12', 'iphone 11', 'iphone se', 'iphone mini'] },
    'galaxy_s': { label: 'Samsung Galaxy S', url: 'https://images.unsplash.com/photo-1610945265064-f45a70262b6f?auto=format&fit=crop&w=300&q=80', keywords: ['samsung', 'galaxy s', 'galaxy s24', 'galaxy s23', 'galaxy s22', 'galaxy ultra', 'galaxy z', 'galaxy fold', 'galaxy flip'] },
    'galaxy_a': { label: 'Samsung Galaxy A', url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=300&q=80', keywords: ['galaxy a', 'galaxy a54', 'galaxy a34', 'galaxy a14', 'galaxy a55', 'galaxy a35', 'galaxy a15', 'samsung budget'] },
    'pixel': { label: 'Google Pixel', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=300&q=80', keywords: ['pixel', 'google pixel', 'pixel 8', 'pixel 9', 'pixel 7', 'pixel pro'] },
    'xiaomi': { label: 'Xiaomi / Redmi', url: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=300&q=80', keywords: ['xiaomi', 'redmi', 'poco', 'redmi note', 'xiaomi 14', 'xiaomi 13'] },
    'generic_phone': { label: 'Smartphone generico', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80', keywords: ['smartphone', 'cellulare', 'telefono', 'mobile', 'oneplus', 'oppo', 'motorola', 'nokia', 'huawei', 'honor'] },
    // ── Tablet ───────────────────────────────────────────────────────────
    'ipad_pro': { label: 'iPad Pro', url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=300&q=80', keywords: ['ipad pro', 'ipad air', 'ipad mini', 'ipad', 'apple tablet'] },
    'galaxy_tab': { label: 'Samsung Galaxy Tab', url: 'https://images.unsplash.com/photo-1561154464-82c09b391606?auto=format&fit=crop&w=300&q=80', keywords: ['galaxy tab', 'tab s9', 'tab s8', 'tab s7', 'tab a', 'samsung tablet'] },
    'generic_tablet': { label: 'Tablet generico', url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=300&q=80', keywords: ['tablet', 'android tablet', 'lenovo tab', 'fire hd', 'kindle'] },
    // ── Monitor & Display ────────────────────────────────────────────────
    'monitor': { label: 'Monitor', url: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=300&q=80', keywords: ['monitor', 'display', 'screen', 'lcd', 'led', 'ips', 'dell p', 'dell u', 'dell s', 'hp e24', 'hp z24', 'hp e27', 'lenovo thinkvision', 'benq', 'philips', 'aoc', 'viewsonic', 'eizo'] },
    'ultrawide': { label: 'Monitor Ultrawide', url: 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=300&q=80', keywords: ['ultrawide', 'curved', 'widescreen', '34 pollici', '38 pollici', '49 pollici', 'ultrasharp', 'dell u34', 'lg ultrawide'] },
    'digital_signage': { label: 'Digital Signage', url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=300&q=80', keywords: ['digital signage', 'totem', 'display pubblicitario', 'pannello', 'signage', 'smart tv', 'commercial display'] },
    // ── Networking ───────────────────────────────────────────────────────
    'switch': { label: 'Network Switch', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80', keywords: ['switch', 'network switch', 'cisco', 'catalyst', 'meraki', 'aruba', 'hpe', 'netgear', 'prosafe', 'd-link', 'managed switch', 'poe switch', 'juniper', 'tp-link'] },
    'router': { label: 'Router / Gateway', url: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=300&q=80', keywords: ['router', 'gateway', 'edge router', 'mikrotik', 'cisco isr', 'cisco rv', 'asus router', 'netgear router', 'tp-link router', 'draytek', 'modem'] },
    'firewall': { label: 'Firewall', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?auto=format&fit=crop&w=300&q=80', keywords: ['firewall', 'fortigate', 'fortinet', 'palo alto', 'sophos', 'sonicwall', 'watchguard', 'pfsense', 'opnsense', 'utm'] },
    'access_point': { label: 'Access Point Wi-Fi', url: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&w=300&q=80', keywords: ['access point', 'ap', 'wifi', 'wi-fi', 'unifi', 'ubiquiti', 'aruba ap', 'cisco ap', 'meraki mr', 'ruckus', 'cambium', 'dream machine', 'udm', 'uap'] },
    'load_balancer': { label: 'Load Balancer', url: 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&w=300&q=80', keywords: ['load balancer', 'f5', 'big-ip', 'citrix', 'netscaler', 'haproxy', 'nginx', 'kemp'] },
    // ── Server & Data Center ─────────────────────────────────────────────
    'server_rack': { label: 'Server Rack', url: 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&w=300&q=80', keywords: ['server', 'rack', 'datacenter', 'data center', 'poweredge', 'proliant', 'thinkserver', 'dell server', 'hp server', 'hpe server', 'lenovo server', 'supermicro', '1u', '2u', '4u', 'blade'] },
    'nas': { label: 'NAS Storage', url: 'https://images.unsplash.com/photo-1600267204091-5c1ab8b10c02?auto=format&fit=crop&w=300&q=80', keywords: ['nas', 'synology', 'qnap', 'storage', 'san', 'iscsi', 'network storage', 'file server'] },
    // ── Power & Infrastructure ───────────────────────────────────────────
    'ups': { label: 'UPS', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80', keywords: ['ups', 'apc', 'eaton', 'cyberpower', 'riello', 'uninterruptible', 'gruppo di continuità', 'batteria', 'back-ups', 'smart-ups'] },
    'pdu': { label: 'PDU', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=300&q=80', keywords: ['pdu', 'power distribution', 'distribuzione', 'rack power', 'apc pdu', 'eaton pdu', 'ciabatta rack'] },
    // ── Print & Scan ─────────────────────────────────────────────────────
    'printer': { label: 'Stampante', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80', keywords: ['printer', 'stampante', 'laserjet', 'officejet', 'deskjet', 'pixma', 'ecotank', 'brother', 'lexmark', 'kyocera', 'ricoh', 'xerox', 'canon printer', 'hp printer', 'laser', 'inkjet', 'getto inchiostro'] },
    'scanner': { label: 'Scanner', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=300&q=80', keywords: ['scanner', 'scanjet', 'flatbed', 'document scanner', 'fujitsu scansnap', 'brother scanner', 'epson scanner', 'scansione'] },
    'copier': { label: 'Fotocopiatrice MFP', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80', keywords: ['copier', 'fotocopiatrice', 'multifunzione', 'mfp', 'mfc', 'sharp copier', 'konica minolta', 'ricoh copier', 'kyocera copier', 'xerox copier', 'bizhub'] },
    'label_printer': { label: 'Etichettatrice', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80', keywords: ['etichettatrice', 'label printer', 'dymo', 'brother label', 'zebra', 'barcode printer', 'thermal printer'] },
    // ── Peripherals & Accessories ────────────────────────────────────────
    'keyboard': { label: 'Tastiera', url: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?auto=format&fit=crop&w=300&q=80', keywords: ['keyboard', 'tastiera', 'mechanical', 'logitech keyboard', 'magic keyboard', 'wireless keyboard', 'ergonomic'] },
    'mouse': { label: 'Mouse', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80', keywords: ['mouse', 'logitech mouse', 'mx master', 'magic mouse', 'wireless mouse', 'trackpad', 'trackball'] },
    'headphones': { label: 'Cuffie / Headset', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80', keywords: ['headphones', 'headset', 'cuffie', 'auricolari', 'noise cancelling', 'sony wh', 'bose', 'jabra', 'plantronics', 'poly', 'airpods', 'earbuds'] },
    'webcam': { label: 'Webcam', url: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=300&q=80', keywords: ['webcam', 'camera', 'logitech brio', 'logitech c920', 'logitech c930', 'razer kiyo', 'web camera'] },
    'docking_station': { label: 'Docking Station', url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=300&q=80', keywords: ['docking station', 'dock', 'thunderbolt dock', 'usb-c dock', 'dell wd', 'dell d6000', 'lenovo thinkpad dock', 'hp dock', 'caldigit', 'wd19', 'wd22', 'hub usb'] },
    'kvm': { label: 'KVM Switch', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80', keywords: ['kvm', 'kvm switch', 'aten', 'raritan', 'avocent', 'console switch'] },
    'external_drive': { label: 'Hard Disk Esterno', url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad09?auto=format&fit=crop&w=300&q=80', keywords: ['hard disk', 'hdd', 'ssd', 'external drive', 'disco esterno', 'wd passport', 'seagate', 'samsung t7', 'usb drive', 'pendrive', 'chiavetta'] },
    'ram': { label: 'RAM / Memoria', url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=300&q=80', keywords: ['ram', 'memoria', 'dimm', 'sodimm', 'ddr4', 'ddr5', 'kingston', 'crucial', 'corsair', 'modulo memoria'] },
    // ── Telephony & Conference ───────────────────────────────────────────
    'voip_phone': { label: 'Telefono VoIP', url: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=300&q=80', keywords: ['voip', 'voip phone', 'telefono ip', 'sip phone', 'yealink', 'cisco ip phone', 'polycom', 'grandstream', 'avaya', 'mitel', 'snom', 'fanvil'] },
    'conference_phone': { label: 'Telefono Conferenza', url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=300&q=80', keywords: ['conference phone', 'conferenza', 'polycom trio', 'yealink cp', 'jabra speak', 'speakerphone', 'owl labs', 'meeting owl', 'rally', 'logitech rally'] },
    'conference_room': { label: 'Sala Conferenze', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80', keywords: ['conference room', 'sala conferenze', 'meeting room', 'teams room', 'zoom room', 'neat bar', 'poly studio', 'logitech meetup', 'rally bar'] },
    // ── Projector & AV ───────────────────────────────────────────────────
    'projector': { label: 'Proiettore', url: 'https://images.unsplash.com/photo-1517601278545-4561928790f4?auto=format&fit=crop&w=300&q=80', keywords: ['projector', 'proiettore', 'beamer', 'epson projector', 'benq projector', 'optoma', 'viewsonic projector', 'laser projector', 'dlp', 'videoproiettore'] },
    // ── Other / Misc ─────────────────────────────────────────────────────
    'drone': { label: 'Drone', url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=300&q=80', keywords: ['drone', 'dji', 'mavic', 'phantom', 'mini', 'air'] },
    'vr_headset': { label: 'VR Headset', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?auto=format&fit=crop&w=300&q=80', keywords: ['vr', 'oculus', 'quest', 'vision pro', 'meta quest', 'pico', 'realtà virtuale', 'mixed reality', 'hololens'] },
    'barcode_scanner': { label: 'Lettore Barcode', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=300&q=80', keywords: ['barcode', 'barcode scanner', 'lettore barcode', 'qr reader', 'honeywell', 'zebra scanner', 'datalogic', 'symbol'] },
    'security_camera': { label: 'Telecamera Sicurezza', url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=300&q=80', keywords: ['security camera', 'telecamera', 'cctv', 'ip camera', 'hikvision', 'dahua', 'axis', 'unifi protect', 'nvr', 'dvr', 'videosorveglianza'] },
    'generic_tech': { label: 'Dispositivo IT', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80', keywords: ['peripheral', 'periferica', 'accessorio', 'adapter', 'adattatore', 'converter', 'dongle', 'cavo', 'cable'] },
};

export const STANDARD_ASSET_FIELDS: { id: string; labelKey: string; type: 'text' | 'number' | 'date' | 'select' | 'textarea'; required?: boolean; options?: any[]; placeholderKey?: string; grid_span?: string }[] = [
    { id: 'name', labelKey: 'asset_name', type: 'text', required: true },
    { id: 'assetTag', labelKey: 'asset_tag', type: 'text', required: true },
    { id: 'model', labelKey: 'model', type: 'text', required: true },
    { id: 'serialNumber', labelKey: 'serial_number', type: 'text', required: true },
    { id: 'status', labelKey: 'status', type: 'select', required: true, options: [
        { value: 'In Use', labelKey: 'status_in_use' },
        { value: 'Ready to Deploy', labelKey: 'status_ready_to_deploy' },
        { value: 'Pending', labelKey: 'status_pending' },
        { value: 'Archived', labelKey: 'status_archived' },
        { value: 'Broken - Not Fixable', labelKey: 'status_broken' },
        { value: 'Lost/Stolen', labelKey: 'status_lost_stolen' },
        { value: 'Out for Diagnostics', labelKey: 'status_out_for_diagnostics' },
        { value: 'Out for Repair', labelKey: 'status_out_for_repair' }
    ]},
    { id: 'location', labelKey: 'location', type: 'text' },
    { id: 'purchaseDate', labelKey: 'purchase_date', type: 'date' },
    { id: 'purchaseCost', labelKey: 'purchase_cost', type: 'number', placeholderKey: 'e.g. 1200.00' },
    { id: 'currentValue', labelKey: 'current_value', type: 'number', placeholderKey: 'Calculated automatically' },
    { id: 'warrantyEndDate', labelKey: 'warranty_end_date', type: 'date', grid_span: 'col-span-2' },
    { id: 'notes', labelKey: 'notes', type: 'textarea', grid_span: 'col-span-full' },
];

export const ASSET_TYPES_CONFIG: Record<string, { 
    fields: typeof STANDARD_ASSET_FIELDS;
    required: string[];
    lifespanYears?: number;
}> = {
    'PC/Laptop': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 4 },
    'Desktop': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'All-in-One': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Virtual Machine': { fields: STANDARD_ASSET_FIELDS.filter(f => f.id !== 'serialNumber'), required: ['name', 'status'], lifespanYears: undefined },
    'Server': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Smartphone': {
        fields: [
            ...STANDARD_ASSET_FIELDS,
            { id: 'phoneNumber', labelKey: 'phone_number', type: 'text' },
            { id: 'carrier', labelKey: 'carrier', type: 'text' },
            { id: 'simSerial', labelKey: 'sim_serial', type: 'text' },
            { id: 'esimSerial', labelKey: 'esim_serial', type: 'text' },
        ],
        required: ['name', 'assetTag', 'model', 'serialNumber', 'status'],
        lifespanYears: 2
    },
    'Tablet': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 3 },
    'VoIP Phone': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Conference Phone': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Monitor': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Projector': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Digital Signage': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Printer': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Scanner': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Copier': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Switch': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 7 },
    'Router': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 7 },
    'Firewall': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Access Point': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Load Balancer': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'PDU': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 10 },
    'UPS': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 3 },
    'Docking Station': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'KVM Switch': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 5 },
    'Webcam': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'model', 'serialNumber', 'status'], lifespanYears: 3 },
    'Peripheral': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'status'], lifespanYears: 3 },
    'RAM': { fields: STANDARD_ASSET_FIELDS.filter(f => f.id !== 'serialNumber'), required: ['name', 'status', 'quantity'], lifespanYears: 5 },
    'Other': { fields: STANDARD_ASSET_FIELDS, required: ['name', 'assetTag', 'status'] }
};