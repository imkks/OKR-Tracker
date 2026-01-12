import React from 'react';
import { X, ClipboardList } from 'lucide-react';
import LogEntryForm from './LogEntryForm';

const QuickLogModal = ({ isOpen, onClose, kr, objectives, onRefresh }) => {
  if (!isOpen || !kr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={18} /> Log Work
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 p-3 bg-indigo-50 text-indigo-900 rounded-lg text-sm border border-indigo-100">
             Logging work for: <strong>{kr.title}</strong>
          </div>
          <LogEntryForm 
            objectives={objectives} 
            preSelectedKR={kr} 
            onComplete={() => { onRefresh(); onClose(); }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
export default QuickLogModal;