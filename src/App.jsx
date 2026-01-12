import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, BookOpen, Plus } from 'lucide-react';

import { getQuarter, calculateProgress, getDaysLeft } from './utils/helpers';
import { api } from './services/trackerService';

// Components
import ObjectiveCard from './components/objectives/ObjectiveCard';
import AddObjectiveModal from './components/objectives/AddObjectiveModal';
import QuickLogModal from './components/logs/QuickLogModal';
import DailyLogView from './components/logs/DailyLogView';

export default function App() {
  const [objectives, setObjectives] = useState([]);
  const [view, setView] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickLogKR, setQuickLogKR] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [quarterFilter, setQuarterFilter] = useState(getQuarter());

  // --- Data Fetching ---
  const loadData = async () => {
    const data = await api.getObjectives();
    setObjectives(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Computed Logic ---
  const filteredObjectives = useMemo(() => {
    return objectives.filter(obj => {
      const matchQuarter = quarterFilter === 'All' || obj.quarter === quarterFilter;
      const matchStatus = statusFilter === 'All' || 
                         (statusFilter === 'Active' && obj.status !== 'Completed') ||
                         obj.status === statusFilter;
      return matchQuarter && matchStatus;
    });
  }, [objectives, statusFilter, quarterFilter]);

  const stats = useMemo(() => {
    const total = objectives.length;
    if (total === 0) return { completion: 0, active: 0, critical: 0 };
    
    const avgProgress = objectives.reduce((acc, obj) => {
       const krs = Array.isArray(obj.keyResults) ? obj.keyResults : [];
       return acc + calculateProgress(krs);
    }, 0) / total;

    const critical = objectives.filter(obj => {
       const krs = Array.isArray(obj.keyResults) ? obj.keyResults : [];
       return getDaysLeft(obj.deadline) < 7 && calculateProgress(krs) < 100;
    }).length;
    
    return { 
      completion: Math.round(avgProgress), 
      active: objectives.filter(o => o.status === 'In Progress').length, 
      critical 
    };
  }, [objectives]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl">Focus<span className="text-indigo-600">Track</span></div>
          <div className="flex space-x-4">
             <button onClick={() => setView('dashboard')} className={`font-medium ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
             {/* <button onClick={() => setView('logs')} className={`font-medium ${view === 'logs' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Daily Log</button> */}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' ? (
          <>
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
               <div className="bg-indigo-600 rounded-xl p-5 text-white col-span-1 md:col-span-2 shadow-lg shadow-indigo-200/50">
                 <div className="text-4xl font-bold">{stats.completion}%</div>
                 <div className="text-indigo-100 font-medium">Total Progress</div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-2xl font-bold text-slate-800">{stats.active}</div>
                  <div className="text-slate-500 text-sm font-medium">Active Goals</div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className={`text-2xl font-bold ${stats.critical > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{stats.critical}</div>
                  <div className="text-slate-500 text-sm font-medium">Critical (7d)</div>
               </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <select value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)} className="p-2 text-sm bg-transparent outline-none text-slate-600 font-medium">
                   <option value="All">All Quarters</option>
                   <option value="Q1">Q1</option>
                   <option value="Q2">Q2</option>
                   <option value="Q3">Q3</option>
                   <option value="Q4">Q4</option>
                </select>
                <div className="w-px bg-slate-200 my-1"></div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 text-sm bg-transparent outline-none text-slate-600 font-medium">
                   <option value="All">All Status</option>
                   <option value="Active">Active</option>
                   <option value="Completed">Completed</option>
                </select>
              </div>
              <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow hover:bg-slate-800 transition-colors">
                <Plus size={18} /> Add Objective
              </button>
            </div>

            {/* List */}
            <div className="space-y-4">
              {filteredObjectives.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
                  No objectives found. Add one to get started!
                </div>
              ) : (
                filteredObjectives.map(obj => (
                  <ObjectiveCard 
                    key={obj.id} 
                    objective={obj} 
                    onQuickLog={(kr) => setQuickLogKR(kr)}
                    onRefresh={loadData}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <DailyLogView objectives={objectives} onRefresh={loadData} />
        )}
      </main>

      <AddObjectiveModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={async (data) => {
          await api.addObjective(data);
          loadData();
        }}
      />
      
      <QuickLogModal 
        isOpen={!!quickLogKR} 
        onClose={() => setQuickLogKR(null)}
        kr={quickLogKR}
        objectives={objectives}
        onRefresh={loadData}
      />
    </div>
  );
}