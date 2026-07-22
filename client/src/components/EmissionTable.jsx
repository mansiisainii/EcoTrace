import React from 'react';

const EmissionTable = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return null;
  }

  const getScopeColor = (scope) => {
    const s = String(scope).toLowerCase();
    if (s.includes('1')) return 'bg-transparent text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-900/50';
    if (s.includes('2')) return 'bg-transparent text-amber-600 border-amber-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-900/50';
    if (s.includes('3')) return 'bg-transparent text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/50';
    return 'bg-transparent text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-900/50';
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
      <table className="w-full text-left border-collapse max-sm:block">
        <thead className="max-sm:hidden">
          <tr className="border-b border-[var(--border)] bg-gray-50 dark:bg-black/10">
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Scope</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Activity</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Region</th>
            <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">CO2e (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] max-sm:block">
          {logs.map((log) => {
            const dateStr = new Date(log.date).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            });
            return (
              <tr key={log._id} className="hover:bg-green-500/5 transition-colors max-sm:block max-sm:p-4 max-sm:space-y-3">
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap text-sm text-[var(--text-primary)] max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase">Date</span>
                  <span>{dateStr}</span>
                </td>
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase">Category</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getCategoryDot(log.category)}`}></div>
                    <span className="text-sm text-[var(--text-primary)] capitalize">{log.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase">Scope</span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getScopeColor(log.scope)}`}>
                    {log.scope || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap text-sm text-[var(--text-muted)] truncate max-w-[200px] max-sm:max-w-full max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase mr-2">Activity</span>
                  <span className="truncate text-right">{log.activityData?.value} {log.activityData?.unit}</span>
                </td>
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap text-sm text-[var(--text-muted)] uppercase max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase">Region</span>
                  <span>{log.region || '-'}</span>
                </td>
                <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 whitespace-nowrap text-sm font-bold text-[var(--data-green)] text-right max-sm:flex max-sm:justify-between max-sm:items-center">
                  <span className="sm:hidden font-bold text-xs text-[var(--text-muted)] uppercase">CO2e (kg)</span>
                  <span>{log.co2e?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="max-sm:block">
          <tr className="bg-gray-50 dark:bg-black/10 border-t border-[var(--border)] max-sm:block max-sm:p-4 max-sm:flex max-sm:justify-between max-sm:items-center">
            <td colSpan="5" className="px-6 py-4 max-sm:px-0 max-sm:py-0 text-right font-bold text-[var(--text-primary)] max-sm:text-left">Total</td>
            <td className="px-6 py-4 max-sm:px-0 max-sm:py-0 text-right font-bold text-[var(--data-green)] text-lg">
              {totalCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default EmissionTable;