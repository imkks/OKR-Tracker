export const getDaysLeft = (deadline) => {
  if (!deadline) return 0;
  const today = new Date();
  const due = new Date(deadline);
  if (isNaN(due.getTime())) return 0;
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getQuarter = () => {
  const month = new Date().getMonth() + 1;
  return `Q${Math.ceil(month / 3)}`;
};

export const calculateProgress = (krs) => {
  if (!krs || !Array.isArray(krs) || krs.length === 0) return 0;
  const totalProgress = krs.reduce((acc, kr) => {
    const current = parseFloat(kr.current) || 0;
    const target = parseFloat(kr.target) || 1;
    const p = Math.min(100, Math.max(0, (current / target) * 100));
    return acc + p;
  }, 0);
  return Math.round(totalProgress / krs.length);
};
// ... keep existing getDaysLeft, getQuarter, calculateProgress ...

// NEW: Calculates YYYY-MM-DD for the last day of the current quarter
export const getEndOfQuarterDate = () => {
  const today = new Date();
  const quarter = Math.ceil((today.getMonth() + 1) / 3);
  const year = today.getFullYear();
  
  // Logic: 
  // Q1 ends Month 3 (March). new Date(Year, 3, 0) gives last day of March.
  // Q2 ends Month 6 (June). new Date(Year, 6, 0) gives last day of June.
  const lastDay = new Date(year, quarter * 3, 0);
  
  // Format to YYYY-MM-DD for HTML input
  return lastDay.toISOString().split('T')[0];
};
// ... existing code ...

// NEW: Category Definitions
export const CATEGORY_CONFIG = {
  'Work': { label: 'Work', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  'Personal': { label: 'Personal', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  'Health': { label: 'Health', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Finance': { label: 'Finance', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  'Learning': { label: 'Learning', color: 'bg-pink-50 text-pink-700 border-pink-100' }
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG);