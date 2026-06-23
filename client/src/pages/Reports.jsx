import React, { useEffect, useState } from 'react';
import { getLogs } from '../api';
import EmissionTable from '../components/EmissionTable';
import { FileText, Globe, AlertTriangle, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
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

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Emissions Report</h1>
          <p className="text-[var(--text-muted)] mt-1">Detailed view of your carbon footprint logs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Total Logs</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{filteredLogs.length}</h3>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Globe className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Total CO2e</p>
              <h3 className="text-2xl font-bold text-green-500">
                {totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
              </h3>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Top Category</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] capitalize">{topCategory}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input-field w-auto cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="lastmonth">Last Month</option>
            <option value="3months">Last 3 Months</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input-field w-auto cursor-pointer"
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
            className="input-field w-auto cursor-pointer"
          >
            <option value="all">All Scopes</option>
            <option value="Scope 1">Scope 1</option>
            <option value="Scope 2">Scope 2</option>
            <option value="Scope 3">Scope 3</option>
          </select>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <div className="card text-center py-12 animate-pulse">
            <p className="text-[var(--text-muted)]">Loading logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <EmissionTable logs={filteredLogs} />
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