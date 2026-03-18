
import React, { useState, useMemo, useRef } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { useData } from '@/hooks/useData';
import { TicketStatus } from '@/types';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, 
  AreaChart, Area, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ReferenceLine, LineChart, Line
} from 'recharts';
import { ICONS } from '@/constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// --- UTILITIES ---
const DateUtils = {
  subDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  },
  startOfDay: (date: Date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },
  endOfDay: (date: Date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
  isWithinInterval: (date: Date, { start, end }: { start: Date, end: Date }) => {
    return date >= start && date <= end;
  },
  formatDate: (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  },
  formatTime: (date: Date) => {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  },
  getDayName: (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  },
  diffHours: (date1: Date, date2: Date) => {
    return (date1.getTime() - date2.getTime()) / 36e5;
  },
  diffDays: (date1: Date, date2: Date) => {
    return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  }
};

const CurrencyUtils = {
    format: (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    }
};

// --- COMPONENTS ---
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode; hasData: boolean; height?: number; subtitle?: string }> = ({ title, children, hasData, height = 350, subtitle }) => (
  <div className="glass-panel p-6 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 flex flex-col bg-white dark:bg-neutral-900/50 backdrop-blur-sm transition-all hover:border-primary-500/30">
    <div className="mb-6 flex-shrink-0">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>}
    </div>
    {/* Explicitly setting min-height helps Recharts calculate dimensions correctly */}
    <div style={{ height, minHeight: height }} className="w-full relative flex-grow">
      {hasData ? <div className="absolute inset-0 w-full h-full">{children}</div> : 
        <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <span className="text-sm font-medium opacity-50">No data available</span>
        </div>}
    </div>
  </div>
);

const StatCard = ({ title, value, subtext, icon, trend, trendValue, colorClass }: any) => (
  <div className="glass-panel p-5 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 bg-white dark:bg-neutral-900/50">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider truncate pr-2">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20 flex-shrink-0`}>
        {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : null}
      </div>
    </div>
    <div className="flex items-end gap-3">
      <div className="text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight leading-none truncate max-w-full">{value}</div>
      {trendValue !== null && (
        <div className={`flex items-center text-xs font-bold mb-1 px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
           <span className="mr-1">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'}</span>
           {Math.abs(trendValue)}%
        </div>
      )}
    </div>
    {subtext && <div className="text-xs text-neutral-400 mt-2 truncate">{subtext}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl text-sm z-50">
        <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-2 border-b border-neutral-100 dark:border-neutral-700 pb-1">{label}</p>
        {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
                  <span className="text-neutral-600 dark:text-neutral-300 capitalize">{p.name}:</span>
                </div>
                <span className="font-mono font-bold text-neutral-900 dark:text-white ml-3">
                    {typeof p.value === 'number' && p.dataKey && (p.dataKey.includes('Cost') || p.dataKey.includes('Value')) 
                        ? CurrencyUtils.format(p.value) 
                        : typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                </span>
            </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- MAIN REPORT COMPONENT ---

const Reports: React.FC = () => {
  const { t } = useLocalization();
  const { tickets, assets, incidents, isLoading } = useData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'assets' | 'analysis' | 'users' | 'audit'>('overview');
  const reportRef = useRef<HTMLDivElement>(null);

  // --- DATA PROCESSING ---
  const rangeConfig = useMemo(() => {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = now;
    let days = 0;

    if (timeRange === 'custom') {
        // If custom dates are set, use them. Otherwise fallback to last 30 days.
        currentStart = customStart ? DateUtils.startOfDay(new Date(customStart)) : DateUtils.startOfDay(DateUtils.subDays(now, 30));
        if (customEnd) {
            currentEnd = DateUtils.endOfDay(new Date(customEnd));
        }
        
        // Calculate days for chart spacing
        const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate previous period for trends (same duration before start)
        const previousEnd = new Date(currentStart.getTime() - 1);
        const previousStart = new Date(previousEnd.getTime() - diffTime);
        
        return { days, currentStart, currentEnd, previousStart, previousEnd, now };
    }

    // Presets
    switch (timeRange) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        case '1y': days = 365; break;
        case 'all': days = 36500; break; // Approx 100 years
    }

    currentStart = DateUtils.startOfDay(DateUtils.subDays(now, days));
    const previousStart = DateUtils.startOfDay(DateUtils.subDays(now, days * 2));
    const previousEnd = DateUtils.startOfDay(DateUtils.subDays(now, days));
    
    return { days, currentStart, currentEnd: now, previousStart, previousEnd, now };
  }, [timeRange, customStart, customEnd]);

  const metrics = useMemo(() => {
    const currentTickets = tickets.filter(t => {
        const d = new Date(t.createdAt);
        return d >= rangeConfig.currentStart && d <= rangeConfig.currentEnd;
    });
    
    const prevTickets = tickets.filter(t => DateUtils.isWithinInterval(new Date(t.createdAt), { start: rangeConfig.previousStart, end: rangeConfig.previousEnd }));
    
    const currentIncidents = incidents.filter(i => {
        const d = new Date(i.createdAt);
        return d >= rangeConfig.currentStart && d <= rangeConfig.currentEnd;
    });
    
    // KPI Basics
    const totalTickets = currentTickets.length;
    const ticketTrend = prevTickets.length > 0 ? Math.round(((totalTickets - prevTickets.length) / prevTickets.length) * 100) : 0;
    
    // OTRS Style SLA Logic
    const openTickets = tickets.filter(t => t.status !== TicketStatus.Closed && t.status !== TicketStatus.Resolved);
    const slaBreaches = currentTickets.filter(t => t.slaDueAt && new Date(t.slaDueAt) < new Date() && ![TicketStatus.Closed, TicketStatus.Resolved].includes(t.status)).length;
    const breachRate = totalTickets > 0 ? ((slaBreaches / totalTickets) * 100).toFixed(1) : '0';

    // MTTR Calculation
    const resolvedTickets = currentTickets.filter(t => (t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed) && t.resolvedAt);
    const totalResolutionHours = resolvedTickets.reduce((acc, t) => acc + Math.abs(DateUtils.diffHours(new Date(t.resolvedAt!), new Date(t.createdAt))), 0);
    const mttr = resolvedTickets.length > 0 ? Math.round(totalResolutionHours / resolvedTickets.length) : 0;

    // Quality Metrics (Simulated)
    let csat = 5.0 - (mttr / 50); 
    if(csat < 3.0) csat = 3.0 + (Math.random() * 0.5); // Add variance
    if(csat > 5.0) csat = 5.0;

    // Re-open Rate (Simulated for Demo)
    const reopenRate = (Math.random() * 5).toFixed(1); // 0-5%

    return { 
        currentTickets, totalTickets, ticketTrend, breachRate, mttr, 
        currentIncidents, openIncidents: incidents.filter(i => i.status !== 'Resolved').length, 
        openTickets, csat: csat.toFixed(1), reopenRate 
    };
  }, [tickets, incidents, rangeConfig]);

  // --- ASSET REPORT METRICS ---
  const assetReportMetrics = useMemo(() => {
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      const warrantyStats = { active: 0, expiring: 0, expired: 0, none: 0 };
      const ageStats = { 'age <1yr': 0, 'age 1-3yrs': 0, 'age 3-5yrs': 0, 'age >5yrs': 0 };
      const locations: Record<string, number> = {};
      const models: Record<string, number> = {};
      const expiringAssets: { id: string, name: string, date: string }[] = [];

      assets.forEach(asset => {
          // Warranty
          if (!asset.warrantyEndDate || asset.warrantyEndDate === 'Lifetime') {
              warrantyStats.none++;
          } else {
              const d = new Date(asset.warrantyEndDate);
              if (d < now) {
                  warrantyStats.expired++;
              } else if (d <= ninetyDaysFromNow) {
                  warrantyStats.expiring++;
                  expiringAssets.push({ id: asset.id, name: asset.name, date: asset.warrantyEndDate });
              } else {
                  warrantyStats.active++;
              }
          }

          // Age
          if (asset.purchaseDate) {
              const purchaseDate = new Date(asset.purchaseDate);
              const ageYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
              if (ageYears < 1) ageStats['age <1yr']++;
              else if (ageYears < 3) ageStats['age 1-3yrs']++;
              else if (ageYears < 5) ageStats['age 3-5yrs']++;
              else ageStats['age >5yrs']++;
          }

          // Location
          if (asset.location) {
              locations[asset.location] = (locations[asset.location] || 0) + 1;
          }

          // Model
          if (asset.model) {
              models[asset.model] = (models[asset.model] || 0) + 1;
          }
      });

      // Prepare Charts
      const warrantyChartData = [
          { name: 'Active', value: warrantyStats.active, color: '#10b981' },
          { name: 'Expiring Soon', value: warrantyStats.expiring, color: '#f59e0b' },
          { name: 'Expired', value: warrantyStats.expired, color: '#ef4444' },
          { name: 'No Warranty', value: warrantyStats.none, color: '#94a3b8' },
      ].filter(d => d.value > 0);

      const ageChartData = Object.entries(ageStats).map(([key, value]) => ({ name: key, value }));
      
      const locationChartData = Object.entries(locations)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Top 8 locations

      return { warrantyChartData, ageChartData, locationChartData, expiringAssets };
  }, [assets]);

  // --- FINANCIAL METRICS (BI) ---
  const financialMetrics = useMemo(() => {
      let totalPurchaseValue = 0;
      let totalDepreciatedValue = 0;
      let wastedSpend = 0;
      let totalLicenseCost = 0;

      const assetsByType: Record<string, number> = {};
      const assetsByStatus: Record<string, { value: number, count: number }> = {};

      assets.forEach(asset => {
          const price = typeof asset.purchaseCost === 'number' ? asset.purchaseCost : 0;
          totalPurchaseValue += price;

          // Depreciation Logic (Straight-line, 4 years life)
          const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
          const ageInDays = DateUtils.diffDays(new Date(), purchaseDate);
          const usefulLifeDays = 4 * 365;
          const depreciationFactor = Math.max(0, (usefulLifeDays - ageInDays) / usefulLifeDays);
          
          const currentValue = asset.currentValue ?? (price * depreciationFactor);
          totalDepreciatedValue += currentValue;

          // License / Waste logic
          if (asset.type === 'License' || asset.type === 'Software') {
              totalLicenseCost += price;
              if (!asset.assignedTo) {
                  wastedSpend += currentValue; // Unused license value is waste
              }
          }

          // Group for charts
          assetsByType[asset.type] = (assetsByType[asset.type] || 0) + currentValue;
          
          // Group by status for the detailed breakdown
          if (!assetsByStatus[asset.status]) {
              assetsByStatus[asset.status] = { value: 0, count: 0 };
          }
          assetsByStatus[asset.status].value += currentValue;
          assetsByStatus[asset.status].count += 1;
      });

      const chartData = Object.entries(assetsByType)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);
        
      const statusChartData = Object.entries(assetsByStatus)
        .map(([name, data]) => ({ name, value: data.value, count: data.count }))
        .sort((a, b) => b.value - a.value);

      return {
          totalPurchaseValue,
          totalDepreciatedValue,
          wastedSpend,
          totalLicenseCost,
          chartData,
          statusChartData
      };
  }, [assets]);


  // --- CHART DATA PREPARATION ---
  
  const ticketAgingData = useMemo(() => {
    const bins = { '0-24h': 0, '1-3 Days': 0, '3-7 Days': 0, '> 7 Days': 0 };
    metrics.openTickets.forEach(t => {
        const daysOpen = DateUtils.diffDays(rangeConfig.now, new Date(t.createdAt));
        if (daysOpen < 1) bins['0-24h']++;
        else if (daysOpen < 3) bins['1-3 Days']++;
        else if (daysOpen < 7) bins['3-7 Days']++;
        else bins['> 7 Days']++;
    });
    return Object.entries(bins).map(([age, count]) => ({ age, count }));
  }, [metrics.openTickets, rangeConfig]);

  const slaForecastData = useMemo(() => {
      const status = { 'Safe': 0, 'Warning (<4h)': 0, 'Breached': 0 };
      metrics.openTickets.forEach(t => {
          if(!t.slaDueAt) { status['Safe']++; return; }
          const hoursLeft = DateUtils.diffHours(new Date(t.slaDueAt), rangeConfig.now);
          if (hoursLeft < 0) status['Breached']++;
          else if (hoursLeft < 4) status['Warning (<4h)']++;
          else status['Safe']++;
      });
      return [
          { name: 'Safe', value: status['Safe'], color: '#10b981' },
          { name: 'Warning (<4h)', value: status['Warning (<4h)'], color: '#f59e0b' },
          { name: 'Breached', value: status['Breached'], color: '#ef4444' }
      ].filter(x => x.value > 0);
  }, [metrics.openTickets, rangeConfig]);

  const inflowOutflowData = useMemo(() => {
    const data: Record<string, { date: string, Created: number, Resolved: number }> = {};
    
    const startDate = rangeConfig.currentStart;
    const endDate = rangeConfig.currentEnd;
    
    let loopStart = startDate;
    const diffDays = DateUtils.diffDays(endDate, startDate);
    if (diffDays > 365 && timeRange === 'all') {
        loopStart = DateUtils.subDays(endDate, 365);
    }

    for (let d = new Date(loopStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = DateUtils.formatDate(d);
        data[dateStr] = { date: dateStr, Created: 0, Resolved: 0 };
    }

    metrics.currentTickets.forEach(t => {
      const d = DateUtils.formatDate(new Date(t.createdAt));
      if (data[d]) data[d].Created++;
      if (t.resolvedAt) {
          const rd = DateUtils.formatDate(new Date(t.resolvedAt));
          if (data[rd]) data[rd].Resolved++;
      }
    });
    return Object.values(data);
  }, [metrics.currentTickets, rangeConfig, timeRange]);

  const heatmapData = useMemo(() => {
      const matrix: Record<string, number> = {};
      metrics.currentTickets.forEach(t => {
          const date = new Date(t.createdAt);
          const key = `${date.getDay()}-${date.getHours()}`;
          matrix[key] = (matrix[key] || 0) + 1;
      });
      const data = [];
      for(let d=0; d<7; d++) {
          for(let h=8; h<20; h++) {
              data.push({ day: d, hour: h, value: matrix[`${d}-${h}`] || 0, dayName: DateUtils.getDayName(d) });
          }
      }
      return data;
  }, [metrics.currentTickets]);

  const userStats = useMemo(() => {
    const stats: Record<string, any> = {};
    const getName = (u: any) => typeof u === 'string' ? u : u?.name || 'Unknown';
    
    metrics.currentTickets.forEach(t => {
      const name = getName(t.requester);
      if(!stats[name]) stats[name] = { name, created: 0, resolved: 0 };
      stats[name].created++;
    });
    metrics.currentTickets.forEach(t => {
      if(t.assignee && (t.status === 'Resolved' || t.status === 'Closed')) {
        const name = getName(t.assignee);
        if(!stats[name]) stats[name] = { name, created: 0, resolved: 0 };
        stats[name].resolved++;
      }
    });

    const list = Object.values(stats);
    return {
      topRequester: [...list].sort((a, b) => b.created - a.created)[0] || { name: 'N/A', created: 0 },
      topAgent: [...list].sort((a, b) => b.resolved - a.resolved)[0] || { name: 'N/A', resolved: 0 },
      chartData: list.filter(u => u.created > 0 || u.resolved > 0).sort((a, b) => (b.created + b.resolved) - (a.created + a.resolved)).slice(0, 8)
    };
  }, [metrics.currentTickets]);

  const activityStream = useMemo(() => {
    const events: Array<{ id: string, type: string, action: string, date: Date, details: string, user: string }> = [];
    metrics.currentTickets.forEach(t => {
      events.push({
        id: t.id, type: 'Ticket', action: 'Created', date: new Date(t.createdAt), 
        details: t.subject, user: typeof t.requester === 'string' ? t.requester : t.requester?.name || 'Unknown'
      });
      if(t.status === 'Resolved' && t.resolvedAt) { 
         events.push({ id: t.id, type: 'Ticket', action: 'Resolved', date: new Date(t.resolvedAt || t.updatedAt), details: `Fix: ${t.subject}`, user: 'System' }); 
      }
    });
    metrics.currentIncidents.forEach(i => {
      events.push({ id: i.id, type: 'Incident', action: 'Reported', date: new Date(i.createdAt), details: i.title, user: 'System' });
    });
    assets.forEach(a => {
       events.push({ id: a.id, type: 'Asset', action: 'Active', date: new Date(), details: `${a.name} (${a.type})`, user: typeof a.assignedTo === 'string' ? a.assignedTo : a.assignedTo?.name || 'Unassigned' });
    });
    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 100);
  }, [metrics, assets]);


  // --- EXPORT (EXCEL MULTI-SHEET) ---
  const handleExportExcel = () => {
      const wb = XLSX.utils.book_new();

      // 1. Executive Summary
      const summaryData = [
          ['Metric', 'Value', 'Note'],
          ['Report Period', timeRange === 'custom' ? `${customStart} to ${customEnd}` : `Last ${timeRange}`, ''],
          ['Total Tickets', metrics.totalTickets, ''],
          ['Avg Resolution Time (MTTR)', `${metrics.mttr} Hours`, ''],
          ['SLA Breach Rate', `${metrics.breachRate}%`, ''],
          ['CSAT Score', metrics.csat, 'Est. based on performance'],
          ['Total Asset Value (Purchase)', CurrencyUtils.format(financialMetrics.totalPurchaseValue), ''],
          ['Current Asset Value (Depreciated)', CurrencyUtils.format(financialMetrics.totalDepreciatedValue), ''],
          ['Potential Wasted Spend', CurrencyUtils.format(financialMetrics.wastedSpend), 'Unused Licenses/Assets']
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

      // 2. Financials
      const financialRows = [
          ['Category', 'Value'],
          ['Total Purchase Value', financialMetrics.totalPurchaseValue],
          ['Total Depreciated Value', financialMetrics.totalDepreciatedValue],
          ['Wasted Spend', financialMetrics.wastedSpend],
          ['Total License Cost', financialMetrics.totalLicenseCost]
      ];
      const wsFinancials = XLSX.utils.aoa_to_sheet(financialRows);
      XLSX.utils.book_append_sheet(wb, wsFinancials, "Financials");

      // 3. Assets
      const assetRows = assets.map(a => ({
          ID: a.id,
          Name: a.name,
          Type: a.type,
          Model: a.model,
          PurchasePrice: a.purchaseCost,
          CurrentValue: a.currentValue,
          PurchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '',
          WarrantyEnd: a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString() : '',
          AssignedTo: typeof a.assignedTo === 'string' ? a.assignedTo : a.assignedTo?.name,
          Status: a.status,
          Location: a.location
      }));
      const wsAssets = XLSX.utils.json_to_sheet(assetRows);
      XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

      // 4. Tickets Data
      const ticketRows = metrics.currentTickets.map(t => ({
          ID: t.id,
          Subject: t.subject,
          Status: t.status,
          Priority: t.priority,
          Requester: typeof t.requester === 'string' ? t.requester : t.requester?.name,
          AssignedTo: typeof t.assignee === 'string' ? t.assignee : t.assignee?.name,
          Created: new Date(t.createdAt).toLocaleDateString(),
          Resolved: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : '',
          SLADue: t.slaDueAt ? new Date(t.slaDueAt).toLocaleDateString() : ''
      }));
      const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
      XLSX.utils.book_append_sheet(wb, wsTickets, "Tickets");
      
      // 5. User Stats
      const userRows = userStats.chartData.map(u => ({
          User: u.name,
          TicketsCreated: u.created,
          TicketsResolved: u.resolved
      }));
      const wsUsers = XLSX.utils.json_to_sheet(userRows);
      XLSX.utils.book_append_sheet(wb, wsUsers, "User Analysis");

      // 6. Audit Log
      const auditRows = activityStream.map(a => ({
          Date: a.date.toLocaleString(),
          Type: a.type,
          Action: a.action,
          User: a.user,
          Details: a.details
      }));
      const wsAudit = XLSX.utils.json_to_sheet(auditRows);
      XLSX.utils.book_append_sheet(wb, wsAudit, "Audit Log");


      // Download
      XLSX.writeFile(wb, `IT_BI_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        onclone: (doc) => {
            const el = doc.querySelector('[data-report-container]') as HTMLElement;
            if(el) { 
                el.classList.remove('dark'); 
                el.style.color = '#000'; 
                el.style.background = '#fff';
                el.querySelectorAll('text').forEach(t => t.style.fill = '#000000');
            }
        }
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pdfW) / canvas.width;
    let heightLeft = imgH, position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
    heightLeft -= pdfH;
    while (heightLeft >= 0) { position = heightLeft - imgH; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH); heightLeft -= pdfH; }
    pdf.save(`ITSM_Report_${timeRange}.pdf`);
  };

  if (isLoading) return <div className="p-8 text-center text-neutral-500 animate-pulse">Loading BI Engine...</div>;

  return (
    <div className="space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white/50 dark:bg-neutral-900/50 p-4 rounded-2xl backdrop-blur-md border border-neutral-200/60 dark:border-neutral-800/60 sticky top-0 z-20 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-4">
                 <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    {ICONS.reports ? React.cloneElement(ICONS.reports as React.ReactElement<any>, { className: 'w-6 h-6 text-primary-600' }) : null}
                    {t('page title reports')}
                </h1>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto max-w-full">
                    {['overview', 'financials', 'assets', 'analysis', 'users', 'audit'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'}`}>
                            {t(`report tab ${tab}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center shrink-0">
                <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                    {(['7d', '30d', '90d', '1y', 'all'] as const).map(range => (
                        <button 
                            key={range} 
                            onClick={() => { setTimeRange(range); setCustomStart(''); setCustomEnd(''); }} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${timeRange === range ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                            {range === 'all' ? 'All' : range}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <input 
                        type="date" 
                        value={customStart} 
                        onChange={(e) => { setCustomStart(e.target.value); setTimeRange('custom'); }}
                        className="bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-md px-2 py-1 border-none focus:ring-1 focus:ring-primary-500 outline-none"
                        placeholder="Start"
                    />
                    <span className="text-neutral-400 text-xs font-bold">-</span>
                    <input 
                        type="date" 
                        value={customEnd} 
                        onChange={(e) => { setCustomEnd(e.target.value); setTimeRange('custom'); }}
                        className="bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-md px-2 py-1 border-none focus:ring-1 focus:ring-primary-500 outline-none"
                        placeholder="End"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2">
                        {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })} Excel
                    </button>
                    <button onClick={handleExportPDF} className="bg-neutral-900 dark:bg-primary-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-2">
                        {React.cloneElement(ICONS.download as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })} PDF
                    </button>
                </div>
            </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} data-report-container className="space-y-6">
            
            {/* KPI STRIP (Smart Context) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {activeTab === 'financials' ? (
                    <>
                        <StatCard title="Total Asset Value" value={CurrencyUtils.format(financialMetrics.totalPurchaseValue)} icon={ICONS.assets} colorClass="text-emerald-600 bg-emerald-100" subtext="Purchase Price" />
                        <StatCard title="Current Value" value={CurrencyUtils.format(financialMetrics.totalDepreciatedValue)} icon={ICONS.chart_bar} colorClass="text-blue-600 bg-blue-100" subtext="After Depreciation" />
                        <StatCard title="Wasted Spend" value={CurrencyUtils.format(financialMetrics.wastedSpend)} icon={ICONS.incidents} colorClass="text-red-600 bg-red-100" subtext="Unassigned Licenses" />
                        <StatCard title="License Cost" value={CurrencyUtils.format(financialMetrics.totalLicenseCost)} icon={ICONS.reports} colorClass="text-purple-600 bg-purple-100" />
                    </>
                ) : activeTab === 'assets' ? (
                    <>
                        <StatCard title="Total Assets" value={assets.length} icon={ICONS.assets} colorClass="text-blue-600 bg-blue-100" />
                        <StatCard title="Active Warranties" value={assetReportMetrics.warrantyChartData.find(d => d.name === 'Active')?.value || 0} icon={ICONS.security} colorClass="text-emerald-600 bg-emerald-100" />
                        <StatCard title="Expiring Warranties" value={assetReportMetrics.warrantyChartData.find(d => d.name === 'Expiring Soon')?.value || 0} icon={ICONS.security} colorClass="text-amber-600 bg-amber-100" subtext="Next 90 Days" />
                        <StatCard title="Expired Warranties" value={assetReportMetrics.warrantyChartData.find(d => d.name === 'Expired')?.value || 0} icon={ICONS.security} colorClass="text-red-600 bg-red-100" />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Volume" value={metrics.totalTickets} icon={ICONS.tickets} colorClass="text-primary-600 bg-primary-100" trend={metrics.ticketTrend > 0 ? 'up' : 'down'} trendValue={metrics.ticketTrend} />
                        <StatCard title="CSAT Score" value={metrics.csat} icon={ICONS.profile} colorClass="text-yellow-600 bg-yellow-100" subtext={`Re-open rate: ${metrics.reopenRate}%`} />
                        <StatCard title="MTTR (Hours)" value={`${metrics.mttr}h`} icon={ICONS.sla} colorClass="text-purple-600 bg-purple-100" subtext="Target: < 24h" />
                        <StatCard title="SLA Breach Rate" value={`${metrics.breachRate}%`} icon={ICONS.sla} colorClass="text-red-600 bg-red-100" trend={Number(metrics.breachRate) > 5 ? 'down' : 'up'} trendValue={null} />
                    </>
                )}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartWrapper title="Ticket Aging (Backlog)" subtitle="How long have current tickets been open?" hasData={ticketAgingData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketAgingData} layout="vertical" margin={{left:10, right:30}}>
                                    <CartesianGrid horizontal={false} opacity={0.3} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="age" type="category" width={80} tick={{fontSize:11, fontWeight:600}} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[0,4,4,0]} barSize={24}>
                                        {ticketAgingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.age.includes('> 7') ? '#ef4444' : entry.age.includes('3-7') ? '#f59e0b' : '#10b981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartWrapper>

                        <ChartWrapper title="Inflow vs Outflow" subtitle="Created vs Resolved Velocity" hasData={inflowOutflowData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inflowOutflowData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="Created" fill="#6366f1" radius={[4,4,0,0]} barSize={20} />
                                    <Bar dataKey="Resolved" fill="#10b981" radius={[4,4,0,0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ChartWrapper title="SLA Forecast" subtitle="Risk analysis of open tickets" hasData={slaForecastData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={slaForecastData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {slaForecastData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-neutral-900 dark:fill-white">
                                        {metrics.openTickets.length}
                                    </text>
                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-medium fill-neutral-500 uppercase">
                                        Open
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                        
                         <div className="lg:col-span-2">
                            <ChartWrapper title="Resolution Trend" subtitle="Daily closure rate" hasData={inflowOutflowData.length > 0}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={inflowOutflowData}>
                                        <defs>
                                            <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="Resolved" stroke="#10b981" fill="url(#colorRes)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartWrapper>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'financials' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartWrapper title="Asset Value Depreciation" subtitle="Purchase Cost vs Current Real Value" hasData={true}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Total Inventory', Purchase: financialMetrics.totalPurchaseValue, Current: financialMetrics.totalDepreciatedValue }]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Purchase" fill="#6366f1" radius={[4,4,0,0]} barSize={40} />
                                <Bar dataKey="Current" fill="#3b82f6" radius={[4,4,0,0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <ChartWrapper title="Asset Value by Status" subtitle="Detailed value breakdown across lifecycle stages" hasData={financialMetrics.statusChartData.length > 0}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialMetrics.statusChartData} layout="vertical" margin={{left: 30, right: 30, top: 10, bottom: 10}}>
                                <CartesianGrid horizontal={false} opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{fontSize:11, fontWeight:600}} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0,4,4,0]} barSize={24} fill="#8b5cf6">
                                    {financialMetrics.statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'][index % 7]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <ChartWrapper title="Cost Distribution by Asset Type" subtitle="Where is the budget going?" hasData={financialMetrics.chartData.length > 0}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={financialMetrics.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                                    {financialMetrics.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <ChartWrapper title="License Spend Efficiency" subtitle="Total Spend vs Active Usage" hasData={financialMetrics.totalLicenseCost > 0}>
                         <div className="flex items-center justify-center h-full">
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Used Licenses</span>
                                    <span className="font-bold">{CurrencyUtils.format(financialMetrics.totalLicenseCost - financialMetrics.wastedSpend)}</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-4 mb-4 dark:bg-neutral-700 overflow-hidden">
                                    <div className="bg-emerald-500 h-4 rounded-full" style={{ width: `${((financialMetrics.totalLicenseCost - financialMetrics.wastedSpend) / financialMetrics.totalLicenseCost) * 100}%` }}></div>
                                </div>
                                
                                <div className="flex justify-between text-sm mb-1 text-red-600">
                                    <span>Wasted Spend (Unassigned)</span>
                                    <span className="font-bold">{CurrencyUtils.format(financialMetrics.wastedSpend)}</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-4 dark:bg-neutral-700 overflow-hidden">
                                    <div className="bg-red-500 h-4 rounded-full" style={{ width: `${(financialMetrics.wastedSpend / financialMetrics.totalLicenseCost) * 100}%` }}></div>
                                </div>
                            </div>
                         </div>
                    </ChartWrapper>
                </div>
            )}

            {activeTab === 'assets' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartWrapper title={t('report warranty status')} subtitle="Assets by warranty condition" hasData={assetReportMetrics.warrantyChartData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={assetReportMetrics.warrantyChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {assetReportMetrics.warrantyChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartWrapper>

                        <ChartWrapper title={t('report asset age')} subtitle="Inventory Age Distribution" hasData={assetReportMetrics.ageChartData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assetReportMetrics.ageChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(key) => t(key.replace(' ', ' '))} />
                                    <YAxis fontSize={11} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartWrapper title={t('report top locations')} subtitle="Where assets are deployed" hasData={assetReportMetrics.locationChartData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assetReportMetrics.locationChartData} layout="vertical" margin={{left: 10, right: 30}}>
                                    <CartesianGrid horizontal={false} opacity={0.3} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11, fontWeight:600}} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartWrapper>

                        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 flex flex-col bg-white dark:bg-neutral-900/50 backdrop-blur-sm h-[350px] min-h-[350px]">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">{t('report expiring warranties')}</h3>
                            {assetReportMetrics.expiringAssets.length > 0 ? (
                                <ul className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                                    {assetReportMetrics.expiringAssets.map(asset => (
                                        <li key={asset.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{asset.name}</span>
                                                <span className="text-xs text-neutral-500">{t('warranty ends')}: {new Date(asset.date).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-xs font-bold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-2 py-1 rounded">
                                                {Math.ceil(DateUtils.diffDays(new Date(asset.date), new Date()))} days
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                    <div className="text-3xl mb-3 opacity-50">✅</div>
                                    <p className="text-sm font-medium">No warranties expiring soon</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'analysis' && (
                <>
                    <div className="grid grid-cols-1 gap-6">
                         <ChartWrapper title="Peak Load Heatmap" subtitle="Ticket creation density (Day vs Hour)" hasData={heatmapData.length > 0}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis type="number" dataKey="hour" name="Hour" unit=":00" domain={[8, 19]} tickCount={12} />
                                    <YAxis type="number" dataKey="day" name="Day" tickFormatter={(val) => DateUtils.getDayName(val)} domain={[0, 6]} tickCount={7} />
                                    <ZAxis type="number" dataKey="value" range={[50, 500]} name="Tickets" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter name="Traffic" data={heatmapData} fill="#f59e0b" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                    </div>
                </>
            )}

            {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <ChartWrapper title="Agent vs Requester Volume" subtitle="Top 8 Most Active Users" hasData={userStats.chartData.length > 0}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userStats.chartData} layout="vertical" margin={{left:0, right:20}}>
                                <CartesianGrid horizontal={false} opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11}} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="created" name="Created" stackId="a" fill="#6366f1" radius={[0,0,0,0]} barSize={20} />
                                <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" radius={[0,4,4,0]} barSize={20} />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="glass-panel p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between bg-white dark:bg-neutral-900/50 h-[165px]">
                             <div>
                                 <p className="text-xs font-bold uppercase text-neutral-500">MVP Agent</p>
                                 <p className="text-xl font-black">{userStats.topAgent.name}</p>
                                 <p className="text-xs text-neutral-400 mt-1">Most tickets resolved</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-3xl font-black text-emerald-600">{userStats.topAgent.resolved}</p>
                                 <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-1 rounded-full inline-block mt-1">TOP SOLVER</span>
                             </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between bg-white dark:bg-neutral-900/50 h-[165px]">
                             <div>
                                 <p className="text-xs font-bold uppercase text-neutral-500">Top Requester</p>
                                 <p className="text-xl font-black">{userStats.topRequester.name}</p>
                                 <p className="text-xs text-neutral-400 mt-1">Most tickets opened</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-3xl font-black text-blue-600">{userStats.topRequester.created}</p>
                                 <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-1 rounded-full inline-block mt-1">TOP USER</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="glass-panel rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden bg-white dark:bg-neutral-900/50">
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/20">
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Audit Trail</h3>
                            <p className="text-xs font-medium text-neutral-500 mt-1">Full chronological activity log</p>
                        </div>
                        <div className="text-xs font-mono bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300">
                            {activityStream.length} Events
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-xs uppercase text-neutral-500 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">User</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Action</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {activityStream.map((log, i) => (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                                        <td className="px-6 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap">
                                            {DateUtils.formatDate(log.date)} <span className="opacity-50 ml-1">{DateUtils.formatTime(log.date)}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                log.type === 'Incident' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30' :
                                                log.type === 'Asset' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30' :
                                                'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30'
                                            }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-neutral-700 dark:text-neutral-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                                                    {log.user.charAt(0)}
                                                </div>
                                                {log.user}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-300 font-medium">{log.action}</td>
                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 truncate max-w-xs group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Reports;
