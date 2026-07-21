import React from 'react';
import { TrendingDown, AlertTriangle, Info } from 'lucide-react';

const RecommendationCard = ({ rec }) => {
  const { title, description, potential_reduction, category, priority } = rec;

  const getPriorityStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          classes: 'bg-transparent text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-400 border dark:border-red-900/50',
        };
      case 'medium':
        return {
          icon: <Info className="w-4 h-4" />,
          classes: 'bg-transparent text-amber-600 border-amber-200 dark:bg-yellow-900/40 dark:text-yellow-400 border dark:border-yellow-900/50',
        };
      case 'low':
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          classes: 'bg-transparent text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 border dark:border-blue-900/50',
        };
    }
  };

  const priorityStyle = getPriorityStyle(priority);

  return (
    <div className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${priorityStyle.classes}`}>
          {priorityStyle.icon}
          <span className="capitalize">{priority}</span>
        </div>
        
        {potential_reduction && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm bg-transparent dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-900/50">
            <TrendingDown className="w-4 h-4" />
            <span>{potential_reduction}</span>
          </div>
        )}
      </div>

      <div className="mb-3">
        <span className="inline-block px-2 py-1 bg-transparent dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs font-medium rounded-full capitalize border border-green-200 dark:border-green-900/50">
          {category || 'General'}
        </span>
      </div>

      <h4 className="font-semibold text-lg text-[var(--text-primary)] mb-2 leading-tight">
        {title}
      </h4>
      
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default RecommendationCard;
