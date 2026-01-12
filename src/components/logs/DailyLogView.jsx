import React, { useState, useEffect } from 'react';
import { BookOpen, Link as LinkIcon } from 'lucide-react';
import LogEntryForm from './LogEntryForm';
import { api } from '../../services/trackerService';

const DailyLogView = ({ objectives, onRefresh }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await api.getLogs();
    setLogs(data);
  };

  const handleLogComplete = async () => {
    await loadLogs(); // Refresh local list
    onRefresh();      // Refresh global stats
  };

  // Helper to find KR title from ID
  const getLinkedKRTitle = (krId) => {
    if (!krId) return null;
    const found = objectives.flatMap(o => o.keyResults || []).find(k => k.id === krId);
    return found ? found.title : 'Deleted Key Result';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <BookOpen className="text-indigo-600 w-5 h-5"/> Daily Reflection
        </h2>
        <p className="text-slate-500 text-sm mb-4">What did you achieve today?</p>
        <LogEntryForm objectives={objectives} onComplete={handleLogComplete} />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">History</h3>
        {logs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
            No logs yet.
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-semibold text-slate-400">{log.date}</div>
                {log.linkedKRId && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                    <LinkIcon size={10} />
                    {getLinkedKRTitle(log.linkedKRId)}
                    {log.progressDelta !== 0 && (
                      <span className="ml-1 text-indigo-500">
                        ({log.progressDelta > 0 ? '+' : ''}{log.progressDelta})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-line text-sm leading-relaxed">{log.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default DailyLogView;