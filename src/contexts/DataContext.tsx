
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Ticket, Asset, License, Incident, KBArticle, User, LicenseAssignment } from '@/types';
import * as api from '@/services/api';
import { supabase } from '@/services/supabaseClient';
import { mapProfileToUser, mapTicketData, mapAssetData, mapLicenseData, mapIncidentData, mapKBArticleData, mapLicenseAssignmentData, mapCommentData } from '@/utils/mappers';
import { useAuth } from '@/hooks/useAuth'; // Added for automation check
import { Role } from '@/types'; // Added for automation check

interface DataContextType {
  tickets: Ticket[];
  assets: Asset[];
  licenses: License[];
  incidents: Incident[];
  articles: KBArticle[];
  users: User[];
  isLoading: boolean;
  refetchData: (dataType: 'tickets' | 'assets' | 'licenses' | 'incidents' | 'articles' | 'users' | 'all') => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const { user } = useAuth(); // Get current user for automation

  // Use refs to provide the latest state to the subscription callback without re-subscribing
  const usersRef = useRef(users);
  useEffect(() => { usersRef.current = users; }, [users]);
  
  const assetsRef = useRef(assets);
  useEffect(() => { assetsRef.current = assets; }, [assets]);

  const fetchData = useCallback(async (dataType: 'all' | 'tickets' | 'assets' | 'licenses' | 'incidents' | 'articles' | 'users' = 'all') => {
    try {
      if (dataType === 'all') {
        const [ticketsData, assetsData, licensesData, incidentsData, articlesData, usersData] = await Promise.all([
          api.getTickets(), api.getAssets(), api.getLicenses(), api.getIncidents(), api.getKBArticles(), api.getUsers()
        ]);
        setTickets(ticketsData);
        setAssets(assetsData);
        setLicenses(licensesData);
        setIncidents(incidentsData);
        setArticles(articlesData);
        setUsers(usersData);
      } 
    } catch (error) {
      console.error("DataContext: Failed to fetch data", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialFetch = async () => {
      setIsLoading(true);
      
      // Reduce timeout to 4s to prevent feeling of infinite loading
      const fetchPromise = fetchData('all');
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 4000));

      await Promise.race([fetchPromise, timeoutPromise]);

      if (isMounted) {
        setIsLoading(false);
        
        // AUTOMATION TRIGGER: Check licenses if admin
        if (user?.role === Role.Admin) {
             api.checkLicenseExpirationsAndCreateTickets(user);
        }
      }
    };

    initialFetch();
    
    const subscription = supabase.channel('public-schema-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        
        const usersMap: Map<string, User> = new Map(usersRef.current.map(u => [u.id, u]));
        const assetsMap: Map<string, {id: string, name: string}> = new Map(assetsRef.current.map(a => [a.id, {id: a.id, name: a.name}]));

        switch (payload.table) {
            case 'profiles':
                setUsers(prev => {
                    const profile = mapProfileToUser(payload.new);
                    if (!profile) return prev; // Safety check
                    if (payload.eventType === 'INSERT') return [profile, ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(u => u.id === payload.new.id ? profile : u);
                    if (payload.eventType === 'DELETE') return prev.filter(u => u.id !== payload.old.id);
                    return prev;
                });
                break;
            case 'tickets':
                const hasValidRequester = usersMap.has(payload.new.requester_id);
                if (!hasValidRequester) {
                    if (payload.eventType === 'UPDATE') {
                        setTickets(prev => prev.filter(t => t.id !== payload.new.id));
                    }
                    return;
                }
                setTickets(prev => {
                    if (payload.eventType === 'INSERT') return [mapTicketData(payload.new, usersMap, assetsMap), ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(t => t.id === payload.new.id ? mapTicketData(payload.new, usersMap, assetsMap) : t);
                    if (payload.eventType === 'DELETE') return prev.filter(t => t.id !== payload.old.id);
                    return prev;
                });
                break;
            case 'assets':
                setAssets(prev => {
                    if (payload.eventType === 'INSERT') return [mapAssetData(payload.new, usersMap), ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(a => a.id === payload.new.id ? mapAssetData(payload.new, usersMap) : a);
                    if (payload.eventType === 'DELETE') return prev.filter(a => a.id !== payload.old.id);
                    return prev;
                });
                break;
            case 'licenses':
                 setLicenses(prev => {
                    if (payload.eventType === 'INSERT') return [mapLicenseData(payload.new, usersMap), ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(l => l.id === payload.new.id ? {...mapLicenseData(payload.new, usersMap), assignments: l.assignments} : l);
                    if (payload.eventType === 'DELETE') return prev.filter(l => l.id !== payload.old.id);
                    return prev;
                });
                break;
            case 'license_assignments':
                 setLicenses(prev => {
                    const newLicenses = [...prev];
                    if (payload.eventType === 'INSERT') {
                        const newAssignment = mapLicenseAssignmentData(payload.new, usersMap);
                        if (!newAssignment) return prev;
                        const licenseIdx = newLicenses.findIndex(l => l.id === payload.new.license_id);
                        if(licenseIdx > -1) newLicenses[licenseIdx].assignments.push(newAssignment);
                    }
                     if (payload.eventType === 'DELETE') {
                        const oldAssignment = payload.old;
                        const licenseIdx = newLicenses.findIndex(l => l.id === oldAssignment.license_id);
                        if(licenseIdx > -1) newLicenses[licenseIdx].assignments = newLicenses[licenseIdx].assignments.filter(a => a.id !== oldAssignment.id);
                    }
                    return newLicenses;
                });
                break;
             case 'comments':
                setTickets(prev => {
                    const newTickets = [...prev];
                    if (payload.eventType === 'INSERT') {
                        const newComment = mapCommentData(payload.new, usersMap);
                        if (!newComment) return prev; // Safety check
                        const ticketIdx = newTickets.findIndex(t => t.id === payload.new.ticket_id);
                        if(ticketIdx > -1) {
                            const updatedTicket = { ...newTickets[ticketIdx] };
                            updatedTicket.comments = [...(updatedTicket.comments || []), newComment];
                            newTickets[ticketIdx] = updatedTicket;
                        }
                    }
                    return newTickets;
                });
                break;
            case 'incidents':
                const hasValidReporter = usersMap.has(payload.new.reporter_id);
                if (!hasValidReporter) {
                    if (payload.eventType === 'UPDATE') {
                        setIncidents(prev => prev.filter(i => i.id !== payload.new.id));
                    }
                    return;
                }
                setIncidents(prev => {
                    if (payload.eventType === 'INSERT') return [mapIncidentData(payload.new, usersMap), ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(i => i.id === payload.new.id ? mapIncidentData(payload.new, usersMap) : i);
                    if (payload.eventType === 'DELETE') return prev.filter(i => i.id !== payload.old.id);
                    return prev;
                });
                break;
            case 'kb_articles':
                const hasValidAuthor = usersMap.has(payload.new.author_id);
                if (!hasValidAuthor) {
                    if (payload.eventType === 'UPDATE') {
                        setArticles(prev => prev.filter(a => a.id !== payload.new.id));
                    }
                    return;
                }
                setArticles(prev => {
                    if (payload.eventType === 'INSERT') return [mapKBArticleData(payload.new, usersMap), ...prev];
                    if (payload.eventType === 'UPDATE') return prev.map(a => a.id === payload.new.id ? mapKBArticleData(payload.new, usersMap) : a);
                    if (payload.eventType === 'DELETE') return prev.filter(a => a.id !== payload.old.id);
                    return prev;
                });
                break;
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, [fetchData, user]); // Added user dependency

  const refetchData = useCallback(async (dataType: 'tickets' | 'assets' | 'licenses' | 'incidents' | 'articles' | 'users' | 'all') => {
    try {
        switch (dataType) {
            case 'tickets':
                setTickets(await api.getTickets());
                break;
            case 'assets':
                setAssets(await api.getAssets());
                break;
            case 'licenses':
                setLicenses(await api.getLicenses());
                break;
            case 'incidents':
                setIncidents(await api.getIncidents());
                break;
            case 'articles':
                setArticles(await api.getKBArticles());
                break;
            case 'users':
                setUsers(await api.getUsers());
                break;
            case 'all':
                await fetchData('all');
                break;
        }
    } catch (error) {
        console.error(`DataContext: Failed to refetch ${dataType}`, error);
    }
  }, [fetchData]);

  const value = useMemo(() => ({
    tickets, assets, licenses, incidents, articles, users, isLoading, refetchData,
  }), [tickets, assets, licenses, incidents, articles, users, isLoading, refetchData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
