import React, { useEffect, useState } from 'react';

const StatCard = ({ title, value, unit, icon: Icon }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Count-up animation
    const target = parseFloat(value);
    if (isNaN(target) || target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const fps = 60;
    const steps = duration / (1000 / fps);
    const increment = target / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 1000 / fps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="card flex flex-col relative">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[var(--text-muted)] text-sm font-medium">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-green-500 absolute top-6 right-6" />}
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-data-green">
            {displayValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
          {unit && <span className="text-[var(--text-muted)] text-sm">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
