import React, { useState } from 'react';
import { 
  Trash2, Calendar, CheckCircle2, ChevronDown, ChevronUp, 
  X, Plus, ClipboardList, AlertCircle 
} from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import { getDaysLeft, calculateProgress } from '../../utils/helpers';
import { api } from '../../services/trackerService';
import { CATEGORY_CONFIG } from '../../utils/helpers'; // Import config

const ObjectiveCard = ({ objective, onQuickLog, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState('');
  const [krFilter, setKrFilter] = useState('all');
 

  
  if (!objective) return null;

  // Safe access to arrays
  const safeKRs = Array.isArray(objective.keyResults) ? objective.keyResults : [];
const catConfig = CATEGORY_CONFIG[objective.category] || CATEGORY_CONFIG['Work'];
  
  // Calculations
  const daysLeft = getDaysLeft(objective.deadline);
  const progress = calculateProgress(safeKRs);
  const isUrgent = daysLeft < 14 && progress < 100;
  const actionsLeft = safeKRs.filter(kr => kr.current < kr.target).length;

  // --- Handlers ---

  // 1. General Update Wrapper
  const handleUpdate = async (data) => {
    await api.updateObjective(objective.id, data);
    onRefresh(); // Refresh parent state
  };

  // 2. Delete Objective
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this objective?')) {
      await api.deleteObjective(objective.id);
      onRefresh();
    }
  };

  // 3. Add New Key Result
  const handleAddKR = async (e) => {
    e.preventDefault();
    if (!newKRTitle || !newKRTarget) return;

    const newKR = {
      id: crypto.randomUUID(),
      title: newKRTitle,
      target: parseFloat(newKRTarget),
      current: 0,
      unit: 'units'
    };

    const updatedKRs = [...safeKRs, newKR];
    
    // Recalculate status automatically
    const newProgress = calculateProgress(updatedKRs);
    let newStatus = objective.status;
    if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

    await handleUpdate({ keyResults: updatedKRs, status: newStatus });
    
    setNewKRTitle('');
    setNewKRTarget('');
  };

  // 4. Update Specific KR (Progress is updated via Logs, but this allows manual edits)
  const handleUpdateKRField = async (krId, field, value) => {
    const updatedKRs = safeKRs.map(kr => {
      if (kr.id === krId) {
        return { ...kr, [field]: value };
      }
      return kr;
    });

    // Check for completion
    const newProgress = calculateProgress(updatedKRs);
    let newStatus = objective.status;
    if (newProgress >= 100) newStatus = 'Completed';
    else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

    await handleUpdate({ keyResults: updatedKRs, status: newStatus });
  };

  // 5. Delete KR
  const handleDeleteKR = async (krId) => {
    const updatedKRs = safeKRs.filter(kr => kr.id !== krId);
    await handleUpdate({ keyResults: updatedKRs });
  };

  // Filter Logic for View
  const filteredKRs = safeKRs.filter(kr => {
    const isFinished = kr.current >= kr.target;
    if (krFilter === 'finished') return isFinished;
    if (krFilter === 'unfinished') return !isFinished;
    return true;
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 ${isUrgent ? 'ring-1 ring-orange-200' : ''}`}>
      {/* --- Main Card Header --- */}
      <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
  {/* Status Badge */}
  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
    objective.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
    objective.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
    'bg-slate-100 text-slate-600'
  }`}>
    {objective.status}
  </span>

  {/* NEW: Category Badge */}
  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${catConfig.color}`}>
    {catConfig.label}
  </span>

  {/* Quarter Badge */}
  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-50 text-slate-500 rounded-full border border-slate-200">
    {objective.quarter}
  </span>
</div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{objective.title}</h3>
          </div>
          <button 
            onClick={handleDelete}
            className="text-slate-300 hover:text-red-500 transition-colors p-1"
            title="Delete Objective"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
          <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-orange-600 font-medium' : ''}`}>
            {isUrgent ? <AlertCircle size={14} /> : <Calendar size={14} />}
            {progress >= 100 ? 'Done' : `${daysLeft} days left`}
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            {actionsLeft} actions left
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar percentage={progress} colorClass={progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'} />
          </div>
          <span className="text-sm font-bold text-slate-700 w-10 text-right">{progress}%</span>
          {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
        </div>
      </div>

      {/* --- Expanded Details Section --- */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-5 animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Filters */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-700 text-sm">Key Results</h4>
            <div className="flex gap-1">
               {['all', 'unfinished', 'finished'].map(f => (
                 <button 
                  key={f}
                  onClick={() => setKrFilter(f)}
                  className={`px-2 py-1 text-xs rounded capitalize transition-colors ${krFilter === f ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {/* List of KRs */}
          <div className="space-y-3">
            {filteredKRs.map((kr) => {
              const krCurrent = parseFloat(kr.current) || 0;
              const krTarget = parseFloat(kr.target) || 1;
              const krProgress = Math.min(100, (krCurrent / krTarget) * 100);
              
              return (
                <div key={kr.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${krProgress >= 100 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {kr.title}
                    </span>
                    <button onClick={() => handleDeleteKR(kr.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar percentage={krProgress} colorClass={krProgress >= 100 ? "bg-emerald-500" : "bg-blue-500"} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <input 
                         type="number" 
                         value={kr.current}
                         onChange={(e) => handleUpdateKRField(kr.id, 'current', parseFloat(e.target.value) || 0)}
                         className="w-16 p-1 border border-slate-200 rounded bg-slate-50 text-center font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                       />
                       <span>/</span>
                       <span className="font-medium">{kr.target}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onQuickLog(kr)}
                          className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-100"
                          title="Log work for this KR"
                        >
                          <ClipboardList size={12} /> Log Work
                        </button>
                        <span className="text-xs font-bold text-slate-400">{Math.round(krProgress)}%</span>
                     </div>
                  </div>
                </div>
              );
            })}
            
            {safeKRs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm italic bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                No key results yet. Break this goal down into steps.
              </div>
            )}
          </div>

          {/* Add KR Form */}
          <form onSubmit={handleAddKR} className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="New Key Result (e.g. Read 5 books)" 
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={newKRTitle}
                onChange={(e) => setNewKRTitle(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Target" 
                className="w-20 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={newKRTarget}
                onChange={(e) => setNewKRTarget(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!newKRTitle || !newKRTarget}
                className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ObjectiveCard;