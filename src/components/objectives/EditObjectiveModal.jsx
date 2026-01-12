import React, { useState, useEffect } from 'react';
import { Target, X, Tag, Save } from 'lucide-react';
import { CATEGORY_KEYS } from '../../utils/helpers';

const EditObjectiveModal = ({ isOpen, onClose, objective, onSave }) => {
  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');

  // Load objective data when modal opens
  useEffect(() => {
    if (objective && isOpen) {
      setTitle(objective.title);
      setQuarter(objective.quarter);
      setDeadline(objective.deadline);
      setCategory(objective.category || 'Work');
    }
  }, [objective, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !deadline) return;
    
    onSave({
      ...objective, // Keep existing ID, KRs, status, etc.
      title,
      quarter,
      deadline,
      category
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" /> Edit Objective
            </h2>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Objective Title</label>
              <input 
                autoFocus type="text"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={title} onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                <Tag size={14} /> Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      category === cat 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Quarter</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={quarter} onChange={(e) => setQuarter(e.target.value)}
                >
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Deadline</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={deadline} onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditObjectiveModal;