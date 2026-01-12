import React, { useState } from 'react';
import { 
  Trash2, Calendar, CheckCircle2, ChevronDown, ChevronUp, 
  X, Plus, ClipboardList, AlertCircle, Pencil, Check, RotateCcw
} from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import { getDaysLeft, calculateProgress, CATEGORY_CONFIG } from '../../utils/helpers';
import { api } from '../../services/trackerService';
import EditObjectiveModal from './EditObjectiveModal';

const ObjectiveCard = ({ objective, onQuickLog, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // New KR Form State
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState('');
  
  // Inline KR Edit State
  const [editingKRId, setEditingKRId] = useState(null);
  const [editKRTitle, setEditKRTitle] = useState('');
  const [editKRTarget, setEditKRTarget] = useState('');

  const [krFilter, setKrFilter] = useState('all');

  if (!objective) return null;

  const safeKRs = Array.isArray(objective.keyResults) ? objective.keyResults : [];
  const daysLeft = getDaysLeft(objective.deadline);
  const progress = calculateProgress(safeKRs);
  const isUrgent = daysLeft < 14 && progress < 100;
  const actionsLeft = safeKRs.filter(kr => kr.current < kr.target).length;
  const catConfig = CATEGORY_CONFIG[objective.category] || CATEGORY_CONFIG['Work'];

  // --- Handlers ---

  const handleUpdate = async (data) => {
    await api.updateObjective(objective.id, data);
    onRefresh();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this objective?')) {
      await api.deleteObjective(objective.id);
      onRefresh();
    }
  };

  // --- KR Management ---

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
    const newProgress = calculateProgress(updatedKRs);
    let newStatus = objective.status;
    if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

    await handleUpdate({ keyResults: updatedKRs, status: newStatus });
    setNewKRTitle('');
    setNewKRTarget('');
  };

  const handleDeleteKR = async (krId) => {
    if(!window.confirm("Delete this key result?")) return;
    const updatedKRs = safeKRs.filter(kr => kr.id !== krId);
    await handleUpdate({ keyResults: updatedKRs });
  };

  // --- KR Inline Editing ---

  const startEditingKR = (kr) => {
    setEditingKRId(kr.id);
    setEditKRTitle(kr.title);
    setEditKRTarget(kr.target);
  };

  const cancelEditingKR = () => {
    setEditingKRId(null);
    setEditKRTitle('');
    setEditKRTarget('');
  };

  const saveEditingKR = async (krId) => {
    const updatedKRs = safeKRs.map(kr => {
      if (kr.id === krId) {
        return { 
          ...kr, 
          title: editKRTitle, 
          target: parseFloat(editKRTarget) || kr.target 
        };
      }
      return kr;
    });

    // Recalculate status
    const newProgress = calculateProgress(updatedKRs);
    let newStatus = objective.status;
    if (newProgress >= 100) newStatus = 'Completed';
    else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

    await handleUpdate({ keyResults: updatedKRs, status: newStatus });
    setEditingKRId(null);
  };

  // Handle Updates from Modal
  const handleEditModalSave = async (updatedObj) => {
    // We only send the fields that can change, excluding keyResults/status which are handled internally
    await handleUpdate({
        title: updatedObj.title,
        deadline: updatedObj.deadline,
        quarter: updatedObj.quarter,
        category: updatedObj.category
    });
  };

  // Filter View
  const filteredKRs = safeKRs.filter(kr => {
    const isFinished = kr.current >= kr.target;
    if (krFilter === 'finished') return isFinished;
    if (krFilter === 'unfinished') return !isFinished;
    return true;
  });

  return (
    <>
<div className={`group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full transition-all duration-300 ${isUrgent ? 'ring-1 ring-orange-200' : ''}`}>        {/* --- Card Header --- */}
       {/* --- Card Header --- */}
        {/* CHANGED: Removed 'flex-1'. Removed 'flex-col'. Content will now stack naturally. */}
        <div 
          className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" 
          onClick={() => setIsExpanded(!isExpanded)}
        >  
          {/* Top Row: Badges & Actions */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                objective.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                objective.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {objective.status}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${catConfig.color}`}>
                {catConfig.label}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-50 text-slate-500 rounded-full border border-slate-200">
                {objective.quarter}
              </span>
            </div>

<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
                className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                title="Edit Objective"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={handleDelete}
                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                title="Delete Objective"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-800 leading-tight mb-4 flex-1">{objective.title}</h3>

          <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
            <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-orange-600 font-medium' : ''}`}>
              {isUrgent ? <AlertCircle size={14} /> : <Calendar size={14} />}
              {progress >= 100 ? 'Done' : `${daysLeft} days left`}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              {actionsLeft} left
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto">
            <div className="flex-1">
              <ProgressBar percentage={progress} colorClass={progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'} />
            </div>
            <span className="text-sm font-bold text-slate-700 w-10 text-right">{progress}%</span>
            {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
          </div>
        </div>

        {/* --- Expanded Details --- */}
        {isExpanded && (
          <div className="bg-slate-50 border-t border-slate-100 p-5 animate-in slide-in-from-top-2 fade-in duration-200">
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

            <div className="space-y-3">
              {filteredKRs.map((kr) => {
                const krCurrent = parseFloat(kr.current) || 0;
                const krTarget = parseFloat(kr.target) || 1;
                const krProgress = Math.min(100, (krCurrent / krTarget) * 100);
                const isEditing = editingKRId === kr.id;
                
                return (
                  <div key={kr.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                    {/* KR Header Row: Display vs Edit Mode */}
                    {isEditing ? (
                       <div className="flex items-center gap-2 mb-1">
                          <input 
                            className="flex-1 text-sm border border-indigo-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                            value={editKRTitle}
                            onChange={(e) => setEditKRTitle(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => saveEditingKR(kr.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check size={16} /></button>
                          <button onClick={cancelEditingKR} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><RotateCcw size={16} /></button>
                       </div>
                    ) : (
                      <div className="flex justify-between items-start group/kr">
                        <span className={`text-sm font-medium ${krProgress >= 100 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {kr.title}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover/kr:opacity-100 transition-opacity">
                          <button onClick={() => startEditingKR(kr)} className="text-slate-300 hover:text-indigo-500">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteKR(kr.id)} className="text-slate-300 hover:text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar percentage={krProgress} colorClass={krProgress >= 100 ? "bg-emerald-500" : "bg-blue-500"} />
                      </div>
                    </div>

                    {/* Footer Row: Progress Stats & Log Button */}
                    <div className="flex items-center justify-between mt-1">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                         {isEditing ? (
                            // Edit Target Input
                            <div className="flex items-center gap-1">
                              <span>Target:</span>
                              <input 
                                type="number"
                                className="w-16 border border-indigo-300 rounded px-1 py-0.5 text-center text-xs outline-none"
                                value={editKRTarget}
                                onChange={(e) => setEditKRTarget(e.target.value)}
                              />
                            </div>
                         ) : (
                            // Display Progress
                            <>
                              <span className="font-medium text-slate-700">{krCurrent}</span>
                              <span>/</span>
                              <span className="font-medium">{kr.target}</span>
                            </>
                         )}
                       </div>
                       
                       {!isEditing && (
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => onQuickLog(kr)}
                              className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                              <ClipboardList size={12} /> Log
                            </button>
                            <span className="text-xs font-bold text-slate-400">{Math.round(krProgress)}%</span>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
              
              {/* Add New KR Form */}
              <form onSubmit={handleAddKR} className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="New Key Result..." 
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={newKRTitle}
                    onChange={(e) => setNewKRTitle(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Target" 
                    className="w-16 px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center"
                    value={newKRTarget}
                    onChange={(e) => setNewKRTarget(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!newKRTitle || !newKRTarget}
                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Edit Objective Modal */}
      <EditObjectiveModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        objective={objective}
        onSave={handleEditModalSave}
      />
    </>
  );
};

export default ObjectiveCard;