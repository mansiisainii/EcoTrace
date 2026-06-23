import React from 'react';

const EmissionTable = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return null;
  }

  const getScopeColor = (scope) => {
    const s = String(scope).toLowerCase();
    if (s.includes('1')) return 'bg-red-900/40 text-red-400 border-red-900/50';
    if (s.includes('2')) return 'bg-yellow-900/40 text-yellow-400 border-yellow-900/50';
    if (s.includes('3')) return 'bg-blue-900/40 text-blue-400 border-blue-900/50';
    return 'bg-gray-900/40 text-gray-400 border-gray-900/50';
  };

  const getCategoryDot = (category) => {
    switch (category?.toLowerCase()) {
      case 'electricity': return 'bg-yellow-400';
      case 'travel': return 'bg-blue-400';
      case 'shipping': return 'bg-orange-400';
      case 'fuel': return 'bg-red-400';
      default: return 'bg-green-400';
    }
  };

  const totalCO2e = logs.reduce((sum, log) => sum + (log.co2e || 0), 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-black/10">
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Scope</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Activity</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Region</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">CO2e (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {logs.map((log) => {
            const dateStr = new Date(log.date).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            });
            return (
              <tr key={log._id} className="hover:bg-green-500/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {dateStr}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getCategoryDot(log.category)}`}></div>
                    <span className="text-sm text-[var(--text-primary)] capitalize">{log.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getScopeColor(log.scope)}`}>
                    {log.scope || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)] truncate max-w-[200px]">
                  {log.activityData?.value} {log.activityData?.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)] uppercase">
                  {log.region || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-500 text-right">
                  {log.co2e?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-black/10 border-t border-[var(--border)]">
            <td colSpan="5" className="px-6 py-4 text-right font-bold text-[var(--text-primary)]">Total</td>
            <td className="px-6 py-4 text-right font-bold text-green-500 text-lg">
              {totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default EmissionTable;