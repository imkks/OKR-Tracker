// src/services/trackerService.js
import { calculateProgress } from '../utils/helpers';

const STORAGE_KEYS = {
  OBJECTIVES: 'okr_objectives',
  LOGS: 'okr_logs'
};

// Helper to simulate async network delay (optional, keeps UI responsive)
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  // --- Objectives ---
  getObjectives: async () => {
    await delay();
    return getLocal(STORAGE_KEYS.OBJECTIVES);
  },

  addObjective: async (data) => {
    await delay();
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    const newObj = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setLocal(STORAGE_KEYS.OBJECTIVES, [newObj, ...objectives]);
    return newObj;
  },

  updateObjective: async (id, data) => {
    await delay();
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    const updated = objectives.map(obj => obj.id === id ? { ...obj, ...data } : obj);
    setLocal(STORAGE_KEYS.OBJECTIVES, updated);
  },

  deleteObjective: async (id) => {
    await delay();
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    setLocal(STORAGE_KEYS.OBJECTIVES, objectives.filter(o => o.id !== id));
  },

  // --- Logs ---
  getLogs: async () => {
    await delay();
    return getLocal(STORAGE_KEYS.LOGS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // --- Complex Transaction: Log + Progress Update ---
  handleLogAndProgress: async (content, date, krId, delta, objectives) => {
    await delay();
    
    // 1. Save Log
    const logs = getLocal(STORAGE_KEYS.LOGS);
    const newLog = {
      id: crypto.randomUUID(),
      content,
      date,
      linkedKRId: krId || null,
      progressDelta: delta || 0,
      createdAt: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.LOGS, [newLog, ...logs]);

    // 2. Update KR if linked
    if (krId && delta !== 0) {
      const objective = objectives.find(obj => obj.keyResults?.some(kr => kr.id === krId));
      
      if (objective) {
        const updatedKRs = objective.keyResults.map(kr => {
          if (kr.id === krId) {
            const current = parseFloat(kr.current) || 0;
            return { ...kr, current: current + parseFloat(delta) };
          }
          return kr;
        });
        
        // Recalculate status
        const newProgress = calculateProgress(updatedKRs);
        let newStatus = objective.status;
        if (newProgress >= 100) newStatus = 'Completed';
        else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

        // Reuse our update method
        const allObjectives = getLocal(STORAGE_KEYS.OBJECTIVES);
        const updatedObjs = allObjectives.map(obj => 
          obj.id === objective.id 
            ? { ...obj, keyResults: updatedKRs, status: newStatus } 
            : obj
        );
        setLocal(STORAGE_KEYS.OBJECTIVES, updatedObjs);
      }
    }
  }
};