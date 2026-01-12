import React, { useMemo } from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { calculateProgress, getDaysLeft } from '../../utils/helpers';

const DashboardStats = ({ objectives }) => {
  // Memoize calculations so we don't recalculate on every render unless objectives change
  const stats = useMemo(() => {
    const total = objectives.length;
    if (total === 0) return { completion: 0, active: 0, critical: 0 };
    
    // 1. Average Progress across all objectives
    const avgProgress = objectives.reduce((acc, obj) => {
       const krs = Array.isArray(obj.keyResults) ? obj.keyResults : [];
       return acc + calculateProgress(krs);
    }, 0) / total;

    // 2. Critical Items (Due in < 7 days AND not complete)
    const critical = objectives.filter(obj => {
       const krs = Array.isArray(obj.keyResults) ? obj.keyResults : [];
       return getDaysLeft(obj.deadline) < 7 && calculateProgress(krs) < 100;
    }).length;
    
    // 3. Active Items
    const active = objectives.filter(obj => obj.status === 'In Progress').length;

    return { completion: Math.round(avgProgress), active, critical };
  }, [objectives]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
      {/* Primary Progress Card */}
      <div className="bg-indigo-600 rounded-xl p-5 text-white col-span-1 md:col-span-2 shadow-lg shadow-indigo-200/50 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="text-4xl font-bold mb-1">{stats.completion}%</div>
          <div className="text-indigo-100 font-medium text-sm">Total OKR Completion</div>
          <div className="mt-4 h-1.5 bg-indigo-900/30 rounded-full overflow-hidden">
             <div className="h-full bg-white/90 rounded-full transition-all duration-1000" style={{ width: `${stats.completion}%` }}></div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
      </div>
      
      {/* Active Goals Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
         <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
           <Target size={18} className="text-indigo-600" /> Active Goals
         </div>
         <div className="text-3xl font-bold text-slate-800">{stats.active}</div>
      </div>

      {/* Critical Goals Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
         <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
           <AlertCircle size={18} className={stats.critical > 0 ? "text-orange-500" : "text-slate-400"} /> 
           Critical (7d)
         </div>
         <div className={`text-3xl font-bold ${stats.critical > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
           {stats.critical}
         </div>
      </div>
    </div>
  );
};

export default DashboardStats;