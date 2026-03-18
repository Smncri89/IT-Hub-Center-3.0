import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocalization } from '@/hooks/useLocalization';

const Notifications: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { t } = useLocalization();
    const navigate = useNavigate();

    useEffect(() => {
        let timer: number | undefined;

        if (isOpen) {
            timer = window.setTimeout(() => {
                setIsOpen(false);
            }, 10000); // 10 seconds
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isOpen]);

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        markAllAsRead();
    };

    const typeClasses: Record<Notification['type'], { bg: string, text: string, icon: React.ReactElement }> = {
        info: { bg: 'bg-blue-500', text: 'text-blue-800 dark:text-blue-200', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg> },
        warning: { bg: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.476 12.27c.63 1.192-.468 2.631-1.744 2.631H3.525c-1.276 0-2.374-1.439-1.744-2.63L8.257 3.1zM9 12a1 1 0 112 0 1 1 0 01-2 0zm1-4a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg> },
        success: { bg: 'bg-green-500', text: 'text-green-800 dark:text-green-200', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
        error: { bg: 'bg-red-500', text: 'text-red-800 dark:text-red-200', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> },
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                title={t('notifications')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-50 border dark:border-neutral-700">
                    <div className="p-3 flex justify-between items-center border-b dark:border-neutral-700">
                      <h3 className="font-semibold">{t('notifications')}</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          {t('mark_all_as_read')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`flex items-start p-3 gap-3 border-b dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer ${n.read ? 'opacity-60' : ''}`}>
                                    <div className={`flex-shrink-0 mt-0.5 ${typeClasses[n.type].text}`}>{typeClasses[n.type].icon}</div>
                                    <div className="flex-1">
                                        <p className="text-sm">{n.message}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                    </div>
                                    {!n.read && <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-1.5 ${typeClasses[n.type].bg}`}></div>}
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-neutral-500 text-center">{t('no_notifications')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;