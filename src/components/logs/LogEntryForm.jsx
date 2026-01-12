import React, { useState, useMemo } from 'react';
import { Save, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/trackerService';

const LogEntryForm = ({ user, objectives, preSelectedKR, onComplete, onCancel }) => {
  const [content, setContent] = useState('');
  const [selectedKRId, setSelectedKRId] = useState(preSelectedKR?.id || '');
  const [progressDelta, setProgressDelta] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const allKRs = useMemo(() => {
    return objectives.flatMap(obj => 
      (obj.keyResults || []).map(kr => ({ ...kr, objTitle: obj.title }))
    );
  }, [objectives]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const today = new Date().toLocaleDateString();
    
    // CHANGED: No user ID needed
    await api.handleLogAndProgress(
      content, today, selectedKRId, progressDelta, objectives
    );
    
    setIsSaving(false);
    setContent('');
    setSelectedKRId('');
    setProgressDelta(0);
    if (onComplete) onComplete();
  };

  const activeKR = allKRs.find(k => k.id === selectedKRId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... Content Input ... */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">What did you work on?</label>
        <textarea 
          required
          className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 text-sm"
          placeholder="Describe your progress..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>

      {/* ... KR Link Logic ... */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
        {/* Dropdown and Progress inputs simplified for brevity, paste from original here */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
            <LinkIcon size={12} /> Link to Key Result (Optional)
          </label>
          <select 
            disabled={!!preSelectedKR}
            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-indigo-500"
            value={selectedKRId}
            onChange={(e) => setSelectedKRId(e.target.value)}
          >
            <option value="">-- No Link --</option>
            {allKRs.map(kr => (
              <option key={kr.id} value={kr.id}>{kr.title} ({kr.objTitle})</option>
            ))}
          </select>
        </div>
        
        {/* Update Input */}
        {selectedKRId && (
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
             <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">Update (+/-)</div>
                <input 
                  type="number" step="any"
                  className="w-full p-1.5 text-sm border border-slate-200 rounded-md outline-none"
                  value={progressDelta}
                  onChange={(e) => setProgressDelta(e.target.value)}
                />
             </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
        )}
        <button 
          type="submit" disabled={isSaving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
        >
          <Save size={16} /> {isSaving ? 'Saving...' : 'Log Entry'}
        </button>
      </div>
    </form>
  );
};

export default LogEntryForm;