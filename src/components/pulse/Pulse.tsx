
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers } from '@/services/api';
import { User, UserStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import Spinner from '@/components/Spinner';
import { supabase } from '@/services/supabaseClient';

type UserWithStatus = User & { status: UserStatus | 'Offline' };

const UserCard: React.FC<{ user: UserWithStatus }> = ({ user }) => {
    const { t } = useLocalization();
    
    // Determine colors based on status
    let statusColors = { bg: 'bg-neutral-300', text: 'text-neutral-400' }; // Offline default
    
    switch (user.status) {
        case UserStatus.Online:
            statusColors = { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
            break;
        case UserStatus.Away:
            statusColors = { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
            break;
        case UserStatus.DoNotDisturb:
            statusColors = { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
            break;
        case UserStatus.Invisible:
            // Invisible appears offline to others, but we handle the mapping before rendering if needed.
            // Here we render it as gray if it somehow gets through.
            statusColors = { bg: 'bg-neutral-400', text: 'text-neutral-500' };
            break;
    }

    const isOffline = user.status === 'Offline';

    return (
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isOffline ? 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0' : ''}`}>
            <div className="relative mb-3">
                <img className="h-24 w-24 rounded-full ring-2 ring-white dark:ring-neutral-900 object-cover" src={user.avatarUrl} alt={user.name} />
                <span className={`absolute bottom-1 right-1 block h-5 w-5 rounded-full ${statusColors.bg} ring-4 ring-white dark:ring-neutral-800`}></span>
            </div>
            <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 truncate w-full">{user.name}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 truncate w-full">{user.email}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t(`role ${user.role.toLowerCase().replace(/ /g, '-')}`)}</p>
            <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${statusColors.text}`}>
                {user.status === 'Offline' ? 'Offline' : t(user.status.toLowerCase()) || user.status}
            </p>
            <p className="text-sm italic text-neutral-500 dark:text-neutral-400 mt-2 h-10 overflow-hidden w-full line-clamp-2">
                {user.statusMessage ? `"${user.statusMessage}"` : ''}
            </p>
        </div>
    );
};

const Session: React.FC = () => {
    const { t } = useLocalization();
    const { user: currentUser, status: currentUserStatus } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [presenceState, setPresenceState] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch all users from DB to have the base list
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                setAllUsers(users);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // 2. Subscribe to Supabase Presence
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                setPresenceState(newState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // console.log('join', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // console.log('leave', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track my initial status
                    await channel.track({
                        user_id: currentUser.id,
                        status: currentUserStatus,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]); // Re-run only if user changes (login/logout)

    // 3. Update presence payload when currentUserStatus changes
    useEffect(() => {
        if (!currentUser) return;
        
        // Find the active channel to update tracking
        const channels = supabase.getChannels();
        const onlineChannel = channels.find(c => c.topic === 'realtime:online-users');
        
        if (onlineChannel) {
            onlineChannel.track({
                user_id: currentUser.id,
                status: currentUserStatus,
                online_at: new Date().toISOString(),
            });
        }
    }, [currentUserStatus, currentUser]);

    // 4. Merge DB users with Presence data
    const usersWithStatus = useMemo(() => {
        return allUsers.map(dbUser => {
            // Check if this user is in the presence state
            const presenceEntry = presenceState[dbUser.id];
            
            let liveStatus: UserStatus | 'Offline' = 'Offline';
            
            if (dbUser.id === currentUser?.id) {
                // Always show my own current status from context to be instant
                liveStatus = currentUserStatus;
            } else if (presenceEntry && presenceEntry.length > 0) {
                // Use the most recent status tracked
                const lastPresence = presenceEntry[0]; // Usually index 0 is fine
                liveStatus = lastPresence.status as UserStatus;
            }

            return {
                ...dbUser,
                status: liveStatus
            };
        });
    }, [allUsers, presenceState, currentUser, currentUserStatus]);

    // 5. Sort: Online first, then by name
    const sortedUsers = useMemo(() => {
        const statusWeight = {
            [UserStatus.Online]: 1,
            [UserStatus.Away]: 2,
            [UserStatus.DoNotDisturb]: 3,
            [UserStatus.Invisible]: 4, // Treated as offline visually if we wanted, but for admins maybe visible? keeping as 4
            'Offline': 5
        };

        return [...usersWithStatus].sort((a, b) => {
            const weightA = statusWeight[a.status] || 5;
            const weightB = statusWeight[b.status] || 5;
            
            if (weightA !== weightB) return weightA - weightB;
            return a.name.localeCompare(b.name);
        });
    }, [usersWithStatus]);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{t('page title session')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Real-time team visibility</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    {usersWithStatus.filter(u => u.status !== 'Offline').length} Online
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedUsers.map(user => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
};

export default Session;
