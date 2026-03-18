
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Notification } from '@/types';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import * as api from '@/services/api';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tickets, assets, licenses } = useData();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vendorInteractions, setVendorInteractions] = useState<any[]>([]);

  useEffect(() => {
      // Fetch vendor interactions separately since they are not in DataContext (yet)
      api.getVendorInteractionsAll().then(setVendorInteractions);
  }, []);

  useEffect(() => {
    if (!user) return;

    const newPotentialNotifications: Notification[] = [];
    const now = new Date();

    const isMuted = (category?: string) => {
        if (!user.muteUntil) return false;
        // Simple check if muteUntil is in future. 
        // More complex logic for weekends/hours handled in AuthContext but applied here? 
        // Actually mute logic usually suppresses *new* notifications or push. 
        // For internal list, we might still show them but marked as 'muted' or just standard.
        // Let's assume critical ones bypass.
        if (category === 'SLA') return false; // SLA always shows
        return new Date(user.muteUntil) > now;
    };

    // SLA Checks
    tickets.forEach(ticket => {
        if ((ticket.status === 'Open' || ticket.status === 'In Progress') && ticket.slaDueAt) {
            const due = new Date(ticket.slaDueAt);
            const timeDiff = due.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);

            if (timeDiff < 0) {
                // Overdue
                newPotentialNotifications.push({ 
                    id: `sla-breach-${ticket.id}`, 
                    type: 'error', 
                    message: `SLA Breached: Ticket #${ticket.id}`, 
                    timestamp: now.toISOString(), 
                    read: false, 
                    link: `/tickets/${ticket.id}`,
                    category: 'SLA'
                });
            } else if (hoursLeft < 4) {
                // Warning
                 newPotentialNotifications.push({ 
                    id: `sla-warning-${ticket.id}`, 
                    type: 'warning', 
                    message: `SLA Warning: Ticket #${ticket.id} due in < 4h`, 
                    timestamp: now.toISOString(), 
                    read: false, 
                    link: `/tickets/${ticket.id}`,
                    category: 'SLA'
                });
            }
        }
    });

    // License Checks
    licenses.forEach(license => {
        if (license.expirationDate) {
            const exp = new Date(license.expirationDate);
            const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 30) {
                 newPotentialNotifications.push({ 
                    id: `lic-exp-${license.id}`, 
                    type: 'warning', 
                    message: `License '${license.name}' expires in ${daysLeft} days`, 
                    timestamp: now.toISOString(), 
                    read: false, 
                    link: `/licenses/${license.id}`,
                    category: 'LICENSE'
                });
            }
        }
    });

    // Warranty Checks
    assets.forEach(asset => {
        if (asset.warrantyEndDate && asset.warrantyEndDate !== 'Lifetime') {
            const end = new Date(asset.warrantyEndDate);
            const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= 30) {
                 newPotentialNotifications.push({ 
                    id: `warranty-exp-${asset.id}`, 
                    type: 'info', 
                    message: `Warranty for '${asset.name}' expires soon`, 
                    timestamp: now.toISOString(), 
                    read: false, 
                    link: `/assets/${asset.id}`,
                    category: 'ASSET'
                });
            }
        }
    });

    // Vendor Interaction Schedule checks
    vendorInteractions.forEach(interaction => {
        if ((interaction.status === 'Open' || interaction.status === 'Pending Intervention') && interaction.scheduledDate) {
            const scheduledDate = new Date(interaction.scheduledDate);
            const isToday = scheduledDate.toDateString() === now.toDateString();
            if (isToday) {
                newPotentialNotifications.push({ 
                    id: `vendor-int-${interaction.id}`,
                    type: 'warning', 
                    message: `Scheduled Intervention TODAY: ${interaction.subject}`, 
                    link: '/vendors', 
                    category: 'VENDOR',
                    timestamp: now.toISOString(),
                    read: false
                });
            }
        }
    });

    // Filter muted (excluding SLA)
    const filteredNotifications = newPotentialNotifications.filter(n => !isMuted(n.category));
    
    // Merge with existing state to avoid duplicates/re-renders if ID exists
    setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newUnique = filteredNotifications.filter(n => !existingIds.has(n.id));
        if (newUnique.length === 0) return prev;
        return [...newUnique, ...prev];
    });

  }, [tickets, assets, licenses, vendorInteractions, user]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: Notification = {
          ...n,
          id: `manual-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};
