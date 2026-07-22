import React, { useEffect, useState } from 'react';
import { getLogs } from '../api';
import EmissionTable from '../components/EmissionTable';
import { FileText, Globe, AlertTriangle, Inbox, Calendar, TrendingUp, PieChart, Download, Printer, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SummaryCard = ({ title, value, icon: Icon, isTextWhite }) => (
  <div className="card relative p-6 flex flex-col justify-between">
    <p className="text-sm text-[var(--text-muted)] mb-4">{title}</p>
    <Icon className="w-5 h-5 text-green-500 absolute top-6 right-6" />
    <h3 className={`text-3xl font-bold ${isTextWhite ? 'text-[var(--text-primary)]' : 'text-[var(--data-green)]'}`}>
      {value}
    </h3>
  </div>
);

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await getLogs();
        setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load emissions report");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const now = new Date();

    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (new Date(log.date) < monthAgo) return false;
    }
    if (dateFilter === 'lastmonth') {
      const start = new Date();
      start.setMonth(start.getMonth() - 2);
      const end = new Date();
      end.setMonth(end.getMonth() - 1);
      if (new Date(log.date) < start || new Date(log.date) > end) return false;
    }
    if (dateFilter === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (new Date(log.date) < threeMonthsAgo) return false;
    }
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (scopeFilter !== 'all' && log.scope !== scopeFilter) return false;
    return true;
  });

  const totalCO2e = filteredLogs.reduce((sum, log) => sum + (log.co2e || 0), 0);

  const categoryCounts = filteredLogs.reduce((acc, log) => {
    if (log.category) acc[log.category] = (acc[log.category] || 0) + (log.co2e || 0);
    return acc;
  }, {});

  const topCategory = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
    : 'N/A';

  const topCategoryPct = totalCO2e > 0 && categoryCounts[topCategory]
    ? ((categoryCounts[topCategory] / totalCO2e) * 100).toFixed(1)
    : 0;

  const todaysLogsCount = filteredLogs.filter(log => new Date(log.date).toDateString() === new Date().toDateString()).length;
  
  const avgPerLog = filteredLogs.length > 0 ? (totalCO2e / filteredLogs.length).toFixed(1) : 0;

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const lastMonthEnd = new Date(currentMonthStart);
  lastMonthEnd.setMilliseconds(-1);

  const currentMonthCO2e = filteredLogs
    .filter(log => new Date(log.date) >= currentMonthStart)
    .reduce((sum, log) => sum + (log.co2e || 0), 0);

  const lastMonthCO2e = filteredLogs
    .filter(log => new Date(log.date) >= lastMonthStart && new Date(log.date) <= lastMonthEnd)
    .reduce((sum, log) => sum + (log.co2e || 0), 0);

  let monthlyChangeText = "No prev data";
  if (lastMonthCO2e > 0) {
    const change = ((currentMonthCO2e - lastMonthCO2e) / lastMonthCO2e) * 100;
    monthlyChangeText = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  // Apply search
  const searchedLogs = filteredLogs.filter(log => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const activityStr = log.activityData 
          ? `${log.activityData.value || ''} ${log.activityData.unit || ''}` 
          : (log.activity || '');
      
      return (
          log.category?.toLowerCase().includes(term) ||
          activityStr.toLowerCase().includes(term) ||
          log.scope?.toLowerCase().includes(term) ||
          log.region?.toLowerCase().includes(term)
      );
  });

  // Apply sort
  const finalLogs = [...searchedLogs].sort((a, b) => {
      switch (sortOrder) {
          case 'oldest': return new Date(a.date) - new Date(b.date);
          case 'highest': return (b.co2e || 0) - (a.co2e || 0);
          case 'lowest': return (a.co2e || 0) - (b.co2e || 0);
          case 'newest': 
          default:
              return new Date(b.date) - new Date(a.date);
      }
  });

  const exportCSV = () => {
    const headers = ["Date", "Category", "Scope", "Activity", "Region", "CO2e (kg)"];
    const rows = finalLogs.map(log => {
        const activityStr = log.activityData 
            ? `${log.activityData.value || ''} ${log.activityData.unit || ''}`.trim()
            : (log.activity || '');
            
        const escapeQuote = (str) => `"${String(str).replace(/"/g, '""')}"`;
            
        return [
            escapeQuote(new Date(log.date).toLocaleDateString()),
            escapeQuote(log.category || ''),
            escapeQuote(log.scope || ''),
            escapeQuote(activityStr),
            escapeQuote(log.region || ''),
            escapeQuote(log.co2e || 0)
        ];
    });
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "emissions_report.csv");
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Emissions Report</h1>
            <p className="text-[var(--text-muted)] mt-1">Detailed analysis and logs of your carbon footprint</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={exportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-500/10 transition-colors text-sm font-semibold">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-[var(--background)] hover:bg-green-600 transition-colors text-sm font-semibold">
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard 
            title="Total Logs" 
            value={filteredLogs.length} 
            icon={FileText} 
          />
          <SummaryCard 
            title="Total CO2e (kg)" 
            value={totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} 
            icon={Globe} 
          />
          <SummaryCard 
            title="Top Category" 
            value={<>
              <span className="capitalize">{topCategory}</span>
              <span className="text-sm text-[var(--text-muted)] font-normal ml-2">({topCategoryPct}%)</span>
            </>} 
            icon={AlertTriangle} 
            isTextWhite 
          />
          <SummaryCard 
            title="Today's Logs" 
            value={todaysLogsCount} 
            icon={Calendar} 
          />
          <SummaryCard 
            title="Monthly Change" 
            value={monthlyChangeText} 
            icon={TrendingUp} 
            isTextWhite 
          />
          <SummaryCard 
            title="Avg per Log (kg)" 
            value={avgPerLog} 
            icon={PieChart} 
          />
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-1/3">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by activity..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm whitespace-nowrap mb-2 sm:mb-0">
              <Filter className="w-4 h-4" />
              <span>Filter & Sort:</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap w-full sm:w-auto">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="input-field w-full sm:w-auto cursor-pointer min-w-[120px]"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="3months">Last 3 Months</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="input-field w-full sm:w-auto cursor-pointer min-w-[120px]"
              >
                <option value="all">All Categories</option>
                <option value="electricity">Electricity</option>
                <option value="travel">Travel</option>
                <option value="shipping">Shipping</option>
                <option value="fuel">Fuel</option>
              </select>

              <select
                value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value)}
                className="input-field w-full sm:w-auto cursor-pointer min-w-[120px]"
              >
                <option value="all">All Scopes</option>
                <option value="Scope 1">Scope 1</option>
                <option value="Scope 2">Scope 2</option>
                <option value="Scope 3">Scope 3</option>
              </select>

              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="input-field w-full sm:w-auto cursor-pointer min-w-[120px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Emission</option>
                <option value="lowest">Lowest Emission</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <div className="card text-center py-12 animate-pulse">
            <p className="text-[var(--text-muted)]">Loading logs...</p>
          </div>
        ) : finalLogs.length > 0 ? (
          <EmissionTable logs={finalLogs} />
        ) : (
          <div className="card text-center py-16 space-y-4">
            <Inbox className="w-16 h-16 text-green-500/40 mx-auto" />
            <p className="text-[var(--text-primary)] text-lg font-semibold">No emissions logged yet</p>
            <p className="text-[var(--text-muted)]">Start by chatting with EcoTrace AI on the Dashboard</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary mt-2"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;