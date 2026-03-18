
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalization } from '@/hooks/useLocalization';
import PieChartCard from './PieChartCard';
import { Ticket, License, Incident, TicketStatus, Role, User, TicketPriority } from '@/types';
import { ICONS, STATUS_COLORS, INCIDENT_STATUS_COLORS } from '@/constants';
import Spinner from './Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';

// --- CONFIG & TYPES ---

interface DashboardConfig {
    showStatusSummary: boolean;
    showSlaStatus: boolean;
    showQuickActions: boolean;
    showTicketsChart: boolean;
    showIncidentsChart: boolean;
    showMyTickets: boolean;
    showLowLicenses: boolean;
    showRecentIncidents: boolean;
}

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
    showStatusSummary: true,
    showSlaStatus: true,
    showQuickActions: true,
    showTicketsChart: true,
    showIncidentsChart: true,
    showMyTickets: true,
    showLowLicenses: true,
    showRecentIncidents: true,
};

// --- HELPER COMPONENTS ---

const DashboardWidget: React.FC<{ title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className = "", action }) => (
    <div className={`glass-panel rounded-3xl p-6 flex flex-col transition-all duration-300 hover:shadow-soft border-white/40 dark:border-white/5 ${className}`}>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white tracking-tight flex items-center gap-2">
                {title}
            </h3>
            {action}
        </div>
        <div className="flex-1 relative">
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ value: string | number; label: string; colorClass: string; to: string; icon?: React.ReactNode }> = ({ value, label, colorClass, to, icon }) => (
    <Link to={to} className={`relative overflow-hidden group p-6 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg h-full border border-white/10 ${colorClass}`}>
        <div className="relative z-10">
            <span className="text-5xl font-extrabold tracking-tight block mb-1 drop-shadow-sm">{value}</span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-90">{label}</span>
        </div>
        {icon && <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity scale-[2.5] rotate-12">{icon}</div>}
    </Link>
);

const ActionButton: React.FC<{ label: string; to: string; state?: object; icon: React.ReactElement<{ className?: string }>; color: string }> = ({ label, to, state, icon, color }) => (
    <Link to={to} state={state} className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group border border-transparent hover:border-white/20 shadow-md ${color}`}>
        <div className="p-3 bg-white/20 rounded-full mb-3 backdrop-blur-md shadow-inner">
            {React.cloneElement(icon, { className: 'w-6 h-6 text-white' })}
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-white">{label}</span>
    </Link>
);

const CustomizeDashboardModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    config: DashboardConfig;
    setConfig: (config: DashboardConfig) => void;
}> = ({ isOpen, onClose, config, setConfig }) => {
    const { t } = useLocalization();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const [localConfig, setLocalConfig] = useState(config);

    useEffect(() => {
        if (isOpen) setLocalConfig(config);
    }, [isOpen, config]);

    const handleToggle = (key: keyof DashboardConfig) => {
        setLocalConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        setConfig(localConfig);
        onClose();
    };

    if (!isRendered) return null;

    const ToggleItem = ({ label, id }: { label: string, id: keyof DashboardConfig }) => (
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl border border-neutral-100 dark:border-neutral-700 transition-colors hover:border-primary-200 dark:hover:border-primary-700/50">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</span>
            <button 
                onClick={() => handleToggle(id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${localConfig[id] ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${localConfig[id] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 w-full max-w-md rounded-3xl shadow-2xl p-6 transform transition-all duration-300 border border-neutral-200 dark:border-neutral-700 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('customize dashboard')}</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    <ToggleItem label={t('status summary')} id="showStatusSummary" />
                    <ToggleItem label={t('sla status')} id="showSlaStatus" />
                    <ToggleItem label={t('quick actions')} id="showQuickActions" />
                    <ToggleItem label={t('tickets by status')} id="showTicketsChart" />
                    <ToggleItem label={t('incidents by category')} id="showIncidentsChart" />
                    <ToggleItem label={t('my assigned tickets')} id="showMyTickets" />
                    <ToggleItem label={t('licenses nearing capacity')} id="showLowLicenses" />
                    <ToggleItem label={t('recent incidents')} id="showRecentIncidents" />
                </div>
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        {t('save changes')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- WIDGET COMPONENTS ---

const StatusSummaryWidget: React.FC<{ tickets: Ticket[], t: Function }> = ({ tickets, t }) => {
  const stats = useMemo(() => {
    const openTickets = tickets.filter(t => t.status === TicketStatus.Open).length;
    const inProgressTickets = tickets.filter(t => t.status === TicketStatus.InProgress).length;
    const unassignedTickets = tickets.filter(t => !t.assignee && (t.status === TicketStatus.Open || t.status === TicketStatus.InProgress)).length;
    return { openTickets, inProgressTickets, unassignedTickets };
  }, [tickets]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
        <StatCard 
            value={stats.openTickets} 
            label={t('ticket status open')} 
            colorClass="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20" 
            to="/tickets?status=Open" 
            icon={ICONS.tickets}
        />
        <StatCard 
            value={stats.inProgressTickets} 
            label={t('ticket status in progress')} 
            colorClass="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/20" 
            to="/tickets?status=In Progress" 
            icon={ICONS.refresh}
        />
        <StatCard 
            value={stats.unassignedTickets} 
            label={t('unassigned')} 
            colorClass="bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/20" 
            to="/tickets?assignee=unassigned" 
            icon={ICONS.users}
        />
    </div>
  );
};

const SlaWidget: React.FC<{ t: Function }> = ({ t }) => (
    <Link to="/tickets" className="block h-full bg-neutral-900 dark:bg-black rounded-3xl p-6 relative overflow-hidden group border border-neutral-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex flex-col items-center justify-center text-center h-full relative z-10">
            <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-8 border-neutral-800 dark:border-neutral-900 flex items-center justify-center shadow-2xl bg-neutral-800 dark:bg-neutral-900">
                    <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">98%</span>
                </div>
                <svg className="absolute top-0 left-0 w-24 h-24 -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="none" className="text-emerald-500" strokeDasharray="289" strokeDashoffset="10" strokeLinecap="round" />
                </svg>
            </div>
            <p className="text-lg font-bold text-white">{t('sla status')}</p>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-1 bg-emerald-900/30 px-2 py-0.5 rounded-full">Excellent</p>
        </div>
    </Link>
);

const QuickActionsWidget: React.FC<{ t: Function }> = ({ t }) => (
  <div className="grid grid-cols-2 gap-4 h-full">
      <ActionButton label={t('new ticket')} to="/tickets" state={{ openModal: true }} icon={ICONS.tickets} color="bg-gradient-to-br from-primary-600 to-primary-700 col-span-2 shadow-primary-600/20" />
      <ActionButton label={t('new asset')} to="/assets" state={{ openModal: true }} icon={ICONS.assets} color="bg-gradient-to-br from-neutral-600 to-neutral-700 shadow-neutral-600/20" />
      <ActionButton label={t('new incident')} to="/incidents" state={{ openModal: true }} icon={ICONS.incidents} color="bg-gradient-to-br from-rose-600 to-pink-700 shadow-rose-600/20" />
  </div>
);

// --- NEW SELF-SERVICE COMPONENTS ---

const AnnouncementBanner: React.FC<{ t: Function }> = ({ t }) => {
    const [bannerConfig, setBannerConfig] = useState<{enabled: boolean, message: string, type: string, updatedAt: number} | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Load Config
        const savedConfig = localStorage.getItem('global_banner_config');
        if (!savedConfig) return;
        
        const config = JSON.parse(savedConfig);
        setBannerConfig(config);

        // 2. Check Dismissal
        const dismissedAt = localStorage.getItem('global_banner_dismissed_at');
        const dismissedTimestamp = dismissedAt ? parseInt(dismissedAt, 10) : 0;

        // Show if enabled AND (updated after last dismissal OR never dismissed)
        if (config.enabled && config.updatedAt > dismissedTimestamp) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        if (bannerConfig) {
            // Store the timestamp of the banner we just dismissed
            localStorage.setItem('global_banner_dismissed_at', bannerConfig.updatedAt.toString());
        }
    };

    if (!isVisible || !bannerConfig || !bannerConfig.message) return null;

    // Styling based on type
    let colorClasses = 'from-blue-500 to-blue-600 shadow-blue-500/20'; // Info default
    let icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

    if (bannerConfig.type === 'warning') {
        colorClasses = 'from-amber-500 to-orange-600 shadow-orange-500/20';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    } else if (bannerConfig.type === 'error') {
        colorClasses = 'from-red-500 to-rose-600 shadow-red-500/20';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }

    return (
        <div className={`bg-gradient-to-r ${colorClasses} rounded-2xl p-4 text-white shadow-lg flex items-start gap-3 animate-fade-in mb-6 relative group`}>
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 pr-6">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-0.5 opacity-90">System Announcement</h3>
                <p className="font-medium text-sm sm:text-base whitespace-pre-wrap">{bannerConfig.message}</p>
            </div>
            <button 
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                title="Dismiss"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};

const ServiceCatalog: React.FC<{ t: Function, navigate: any }> = ({ t, navigate }) => {
    const services = [
        {
            id: 'new_hardware',
            title: 'Request Hardware',
            desc: 'Laptops, Monitors, Peripherals',
            icon: ICONS.laptop,
            color: 'bg-blue-500',
            defaults: { subject: 'New Hardware Request', category: 'Hardware', subcategory: 'Laptop', priority: TicketPriority.Medium }
        },
        {
            id: 'software_issue',
            title: 'Software Issue',
            desc: 'Installation, Licenses, Errors',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
            color: 'bg-indigo-500',
            defaults: { subject: 'Software Issue', category: 'Software', subcategory: 'Other', priority: TicketPriority.Medium }
        },
        {
            id: 'access_request',
            title: 'Access & VPN',
            desc: 'New accounts, VPN, Permissions',
            icon: ICONS.security,
            color: 'bg-emerald-500',
            defaults: { subject: 'Access Request', category: 'Access', subcategory: 'Permissions', priority: TicketPriority.Medium }
        },
        {
            id: 'password_reset',
            title: 'Reset Password',
            desc: 'Unlock account or reset creds',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
            color: 'bg-rose-500',
            defaults: { subject: 'Password Reset Request', category: 'Access', subcategory: 'Password Reset', priority: TicketPriority.High }
        },
         {
            id: 'printer_issue',
            title: 'Printer/Scanner',
            desc: 'Paper jams, toner, connectivity',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
            color: 'bg-orange-500',
            defaults: { subject: 'Printer Issue', category: 'Hardware', subcategory: 'Printer', priority: TicketPriority.Medium }
        },
        {
            id: 'general_inquiry',
            title: 'General Inquiry',
            desc: 'Questions, Feedback, Other',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            color: 'bg-slate-500',
            defaults: { subject: 'General Inquiry', category: 'Other', subcategory: 'General Inquiry', priority: TicketPriority.Low }
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map(service => (
                <div 
                    key={service.id}
                    onClick={() => navigate('/tickets', { state: { openModal: true, ticketDefaults: service.defaults } })}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm hover:shadow-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer group transition-all duration-300 hover:-translate-y-1"
                >
                    <div className={`w-12 h-12 rounded-xl ${service.color} text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                        {React.cloneElement(service.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">{service.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-tight">{service.desc}</p>
                </div>
            ))}
        </div>
    );
}

// --- END USER DASHBOARD ---

const EndUserDashboard: React.FC = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { tickets, isLoading } = useData();
    const navigate = useNavigate();
    
    const userTickets = useMemo(() => {
        if (!user || !tickets) return [];
        return tickets.filter(t => t.requester.id === user.id);
    }, [tickets, user]);

    const recentTickets = useMemo(() => {
        return [...userTickets]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
    }, [userTickets]);

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                        {t('greeting user', { name: user?.name.split(' ')[0] || '' })}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">How can we help you today?</p>
                </div>
            </div>
            
            {/* Global Announcement - Visible to Everyone */}
            <AnnouncementBanner t={t} />
            
            {/* Service Catalog */}
            <div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-1.5 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </span>
                    Service Catalog
                </h2>
                <ServiceCatalog t={t} navigate={navigate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Tickets List */}
                <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden border border-white/50 dark:border-neutral-700 shadow-soft flex flex-col h-full">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-700/50 flex justify-between items-center bg-white/50 dark:bg-neutral-800/50">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">{t('your recent tickets')}</h3>
                        <Link to="/tickets" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-wide">{t('view all tickets')}</Link>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {recentTickets.length > 0 ? (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {recentTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} className="p-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[ticket.status].includes('emerald') ? 'bg-emerald-500' : STATUS_COLORS[ticket.status].includes('violet') ? 'bg-violet-500' : 'bg-neutral-400'}`}></div>
                                            <div>
                                                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 transition-colors line-clamp-1">{ticket.subject}</div>
                                                <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                                                    <span className="font-mono bg-neutral-100 dark:bg-neutral-800/80 px-1.5 rounded">{ticket.id}</span>
                                                    <span>•</span>
                                                    <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border border-transparent ${STATUS_COLORS[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                                <div className="text-4xl mb-3 opacity-30">🎫</div>
                                <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">{t('no tickets prompt')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-4">
                     <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-500 mb-1">Active Tickets</p>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white">{userTickets.filter(t => t.status === TicketStatus.Open || t.status === TicketStatus.InProgress).length}</p>
                        </div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                             {React.cloneElement(ICONS.tickets as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
                        </div>
                    </div>
                     <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-500 mb-1">Resolved (All Time)</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{userTickets.filter(t => t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed).length}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN & AGENT DASHBOARD ---

const AdminAgentDashboard: React.FC = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { tickets, licenses, incidents, isLoading } = useData();
    const navigate = useNavigate();
    
    // Configuration State
    const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
        const saved = localStorage.getItem(`dashboard_config_${user?.id}`);
        return saved ? JSON.parse(saved) : DEFAULT_DASHBOARD_CONFIG;
    });
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`dashboard_config_${user.id}`, JSON.stringify(dashboardConfig));
        }
    }, [dashboardConfig, user]);

    if (isLoading) return <Spinner />;
    if (!user) return null;

    // Chart Data Generation
    const ticketChartData = [
        { name: t('ticket status open'), value: tickets.filter(t => t.status === TicketStatus.Open).length },
        { name: t('ticket status in progress'), value: tickets.filter(t => t.status === TicketStatus.InProgress).length },
        { name: t('ticket status closed'), value: tickets.filter(t => t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed).length },
    ].filter(item => item.value > 0);
    const TICKET_COLORS = ['#10b981', '#8b5cf6', '#64748b'];

    const incidentChartData = Object.entries(incidents.reduce((acc: Record<string, number>, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
    }, {})).map(([key, value]) => ({
        name: t(`incident category ${key.toLowerCase().replace(/ /g, ' ')}`),
        value,
    }));
    const INCIDENT_COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#a8a29e'];

    const myTickets = tickets.filter(t => t.assignee?.id === user.id && (t.status === TicketStatus.Open || t.status === TicketStatus.InProgress)).slice(0, 5);
    const lowLicenses = licenses.filter(l => l.totalSeats > 0 && (l.assignments.length / l.totalSeats) >= 0.9).slice(0, 5);
    const recentIncidents = [...incidents].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Global Announcement - Visible to Admins too */}
            <AnnouncementBanner t={t} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{t('dashboard')}</h1>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">Overview of IT operations</p>
                </div>
                <button 
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md text-neutral-700 dark:text-neutral-200"
                >
                    {React.cloneElement(ICONS.settings as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                    {t('customize')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Top Row: Stats & Actions */}
                {dashboardConfig.showStatusSummary && (
                    <div className="col-span-12 lg:col-span-6 xl:col-span-6 min-h-[180px]">
                        <StatusSummaryWidget tickets={tickets} t={t} />
                    </div>
                )}
                {dashboardConfig.showSlaStatus && (
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-3 min-h-[180px]">
                        <SlaWidget t={t} />
                    </div>
                )}
                {dashboardConfig.showQuickActions && (
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-3 min-h-[180px]">
                        <QuickActionsWidget t={t} />
                    </div>
                )}

                {/* Middle Row: Charts */}
                {dashboardConfig.showTicketsChart && (
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px]">
                        <DashboardWidget title={t('tickets by status')} className="h-full">
                            <PieChartCard title="" data={ticketChartData} colors={TICKET_COLORS} />
                        </DashboardWidget>
                    </div>
                )}
                {dashboardConfig.showIncidentsChart && (
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px]">
                        <DashboardWidget title={t('incidents by category')} className="h-full">
                            <PieChartCard title="" data={incidentChartData} colors={INCIDENT_COLORS} />
                        </DashboardWidget>
                    </div>
                )}
                {dashboardConfig.showMyTickets && (
                    <div className="col-span-12 lg:col-span-4 min-h-[350px]">
                        <DashboardWidget title={t('my assigned tickets')} className="h-full" action={<Link to="/tickets?view=my_tickets" className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full uppercase tracking-wider transition-colors">{t('view all tickets')}</Link>}>
                            {myTickets.length > 0 ? (
                                <div className="space-y-3">
                                    {myTickets.map(ticket => (
                                        <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-700 cursor-pointer group transition-all shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 flex-1 mr-3">
                                                    <p className="text-xs font-mono text-primary-500 mb-1 font-medium bg-primary-50 dark:bg-primary-900/20 inline-block px-1.5 rounded">{ticket.id}</p>
                                                    <p className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{ticket.subject}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                    <div className="text-4xl mb-3 opacity-50">👍</div>
                                    <p className="text-sm font-medium">{t('all caught up')}</p>
                                </div>
                            )}
                        </DashboardWidget>
                    </div>
                )}

                {/* Bottom Row: Tables/Lists */}
                {dashboardConfig.showLowLicenses && (
                    <div className="col-span-12 lg:col-span-6 min-h-[300px]">
                        <DashboardWidget title={t('licenses nearing capacity')}>
                            {lowLicenses.length > 0 ? (
                                <div className="space-y-4">
                                    {lowLicenses.map(license => (
                                        <div key={license.id} onClick={() => navigate(`/licenses/${license.id}`)} className="group cursor-pointer p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200 group-hover:text-primary-600 transition-colors">{license.name}</span>
                                                <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{license.assignments.length}/{license.totalSeats}</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-500 group-hover:shadow-[0_0_10px_rgba(225,29,72,0.5)]" style={{ width: `${(license.assignments.length / license.totalSeats) * 100}%`}}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                    <div className="text-3xl mb-3 opacity-50">✅</div>
                                    <p className="text-sm font-medium">{t('no low licenses')}</p>
                                </div>
                            )}
                        </DashboardWidget>
                    </div>
                )}
                {dashboardConfig.showRecentIncidents && (
                    <div className="col-span-12 lg:col-span-6 min-h-[300px]">
                        <DashboardWidget title={t('recent incidents')}>
                            {recentIncidents.length > 0 ? (
                                <div className="space-y-3">
                                    {recentIncidents.map(incident => (
                                        <div key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)} className="flex items-center p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all hover:shadow-sm group">
                                            <div className="relative">
                                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
                                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                                            </div>
                                            <div className="flex-1 min-w-0 ml-4">
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{incident.title}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">{new Date(incident.updatedAt).toLocaleDateString()} • {incident.severity}</p>
                                            </div>
                                            <span className={`ml-2 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${INCIDENT_STATUS_COLORS[incident.status]}`}>
                                                {incident.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                    <div className="text-3xl mb-3 opacity-50">🛡️</div>
                                    <p className="text-sm font-medium">{t('no active incidents')}</p>
                                </div>
                            )}
                        </DashboardWidget>
                    </div>
                )}
            </div>

            <CustomizeDashboardModal 
                isOpen={isConfigModalOpen} 
                onClose={() => setIsConfigModalOpen(false)} 
                config={dashboardConfig} 
                setConfig={setDashboardConfig} 
            />
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) return <Spinner />;

    if (user.role === Role.EndUser || user.role === Role.Member) {
        return <EndUserDashboard />;
    }

    return <AdminAgentDashboard />;
};

export default Dashboard;
