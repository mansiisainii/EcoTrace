import React, { useEffect, useState } from 'react';
import { getLogs } from '../api';
import EmissionTable from '../components/EmissionTable';
import { FileText, Globe, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await getLogs();
        // Since getLogs returns the raw array directly as response.data
        setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load emissions reports data");
      } finally {
        setLoading(true); // Keep loading state updated
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Calculate quick metrics for the report cards dynamically
  const totalCO2e = logs.reduce((sum, log) => sum + (log.co2e || 0), 0);
  
  const categoryCounts = logs.reduce((acc, log) => {
    if (log.category) acc[log.category] = (acc[log.category] || 0) + (log.co2e || 0);
    return acc;
  }, {});
  
  const topCategory = Object.keys(categoryCounts).length > 0 
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b) 
    : 'N/A';

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Emissions Report</h1>
          <p className="text-[var(--text-muted)] mt-1">Detailed view of your carbon footprint logs</p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Total Logs</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{logs.length}</h3>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><Globe className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Total CO2e</p>
              <h3 className="text-2xl font-bold text-green-500">{totalCO2e.toLocaleString()} kg</h3>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Top Category</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] capitalize">{topCategory}</h3>
            </div>
          </div>
        </div>

        {/* Dynamic Logs Condition */}
        {loading ? (
          <div className="card text-center py-12 text-[var(--text-muted)] animate-pulse">Loading logs...</div>
        ) : logs.length > 0 ? (
          <EmissionTable logs={logs} />
        ) : (
          <div className="card text-center py-12 space-y-4">
            <p className="text-[var(--text-muted)] text-lg">No emissions logged matching your context database parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;