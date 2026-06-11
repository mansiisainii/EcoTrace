import React, { useEffect, useState } from 'react';
import { FileText, Weight, AlertTriangle, Inbox } from 'lucide-react';
import { getLogs } from '../api';
import EmissionTable from '../components/EmissionTable';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('All Time');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterScope, setFilterScope] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await getLogs();
        setLogs(data.data || []);
      } catch (error) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterCategory !== 'All' && log.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (filterScope !== 'All' && log.scope !== parseInt(filterScope.split(' ')[1])) return false;
    
    if (filterDate !== 'All Time') {
      const logDate = new Date(log.date);
      const now = new Date();
      if (filterDate === 'This Month') {
        if (logDate.getMonth() !== now.getMonth() || logDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === 'Last Month') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        if (logDate.getMonth() !== lastMonth.getMonth() || logDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === 'Last 3 Months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        if (logDate < threeMonthsAgo) return false;
      }
    }
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalLogsCount = filteredLogs.length;
  const totalCO2e = filteredLogs.reduce((sum, log) => sum + (log.co2e || 0), 0);
  
  // Calculate top category
  const catCount = {};
  filteredLogs.forEach(log => {
    catCount[log.category] = (catCount[log.category] || 0) + log.co2e;
  });
  const topCategory = Object.keys(catCount).sort((a, b) => catCount[b] - catCount[a])[0] || 'N/A';

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Emissions Report</h1>
          <p className="text-[var(--text-muted)] mt-1">Detailed view of your carbon footprint logs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-[var(--text-muted)] text-sm font-medium">Total Logs</h3>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalLogsCount}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Weight className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-[var(--text-muted)] text-sm font-medium">Total CO2e</h3>
              <p className="text-2xl font-bold text-green-500">
                {totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-[var(--text-muted)]">kg</span>
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-[var(--text-muted)] text-sm font-medium">Top Category</h3>
              <p className="text-xl font-bold text-[var(--text-primary)] capitalize truncate">{topCategory}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <select 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            className="input-field py-2 px-3 w-auto min-w-[150px]"
          >
            <option>All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
          </select>

          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field py-2 px-3 w-auto min-w-[150px]"
          >
            <option>All</option>
            <option>Electricity</option>
            <option>Travel</option>
            <option>Shipping</option>
            <option>Fuel</option>
            <option>Cloud Computing</option>
          </select>

          <select 
            value={filterScope} 
            onChange={(e) => setFilterScope(e.target.value)}
            className="input-field py-2 px-3 w-auto min-w-[150px]"
          >
            <option>All</option>
            <option>Scope 1</option>
            <option>Scope 2</option>
            <option>Scope 3</option>
          </select>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="h-64 bg-[var(--card)] rounded-2xl border border-[var(--border)] animate-pulse"></div>
        ) : filteredLogs.length > 0 ? (
          <EmissionTable logs={filteredLogs} />
        ) : (
          <div className="card flex flex-col items-center justify-center py-20 border-dashed border-2">
            <Inbox className="w-16 h-16 text-green-500/40 mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No emissions logged yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Start by chatting with EcoTrace AI on the Dashboard</p>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary"
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
