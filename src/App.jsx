import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Plus, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './config/firebase';
import { getQuarter, CATEGORY_KEYS, CATEGORY_CONFIG } from './utils/helpers';
import { api } from './services/trackerService';
import icon from './assets/icon.png';
// Components
import UserMenu from './components/common/UserMenu';
import AuthModal from './components/common/AuthModal'; // Ensure this is imported
import ObjectiveCard from './components/objectives/ObjectiveCard';
import AddObjectiveModal from './components/objectives/AddObjectiveModal';
import QuickLogModal from './components/logs/QuickLogModal';
import DailyLogView from './components/logs/DailyLogView';
import DashboardStats from './components/stats/DashboardStats';

export default function App() {
  const [user, setUser] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [view, setView] = useState('dashboard');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Auth Modal State
  const [quickLogKR, setQuickLogKR] = useState(null);
  
  // Filter States
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [quarterFilter, setQuarterFilter] = useState(getQuarter());

  // --- 1. Load Local Data Immediately ---
  const loadLocalData = async () => {
    const data = await api.getObjectives();
    setObjectives(data);
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  // --- 2. Auth & Sync Logic ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const toastId = toast.loading("Syncing...");
        await api.syncFull(currentUser.uid);
        await loadLocalData();
        toast.success("Synced", { id: toastId });
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Logic for Tabs & Filters ---
  const availableTabs = useMemo(() => {
    const usedCategories = new Set(objectives.map(obj => obj.category || 'Work'));
    return CATEGORY_KEYS.filter(key => usedCategories.has(key));
  }, [objectives]);

  useEffect(() => {
    if (availableTabs.length > 0 && !activeTab) setActiveTab(availableTabs[0]);
  }, [availableTabs, activeTab]);

  const visibleObjectives = useMemo(() => {
    return objectives.filter(obj => {
      const objCategory = obj.category || 'Work';
      if (objCategory !== activeTab) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = obj.title.toLowerCase().includes(query);
        const matchesKR = obj.keyResults?.some(kr => kr.title.toLowerCase().includes(query));
        if (!matchesTitle && !matchesKR) return false;
      }
      
      const matchQuarter = quarterFilter === 'All' || obj.quarter === quarterFilter;
      const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' && obj.status !== 'Completed') || obj.status === statusFilter;
      
      return matchQuarter && matchStatus;
    });
  }, [objectives, activeTab, statusFilter, quarterFilter, searchQuery]);

  // --- Handlers ---
  const handleAddObjective = async (data) => {
    await api.addObjective(data); // Service handles uid check internally
    toast.success("Goal Created!");
    loadLocalData();
    if(data.category) setActiveTab(data.category);
  };

  const handleRefresh = async () => {
    loadLocalData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Toaster 
        position="bottom-right"
        containerStyle={{ zIndex: 99999 }} // Force on top
      />

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl flex items-center gap-2">
      {/* Old Icon: <LayoutDashboard className="text-indigo-600" /> */}
      
      {/* New Image Icon */}
      <img src={icon} alt="Logo" className="w-8 h-8 object-contain" />
      
      <span>FocusTrack</span>
    </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Board</button>
                <button onClick={() => setView('logs')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Logs</button>
             </div>
             <UserMenu user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' ? (
          <>
            <DashboardStats objectives={objectives} />
            
            {/* Controls Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
               
               {/* Left: Tabs */}
               <div className="flex overflow-x-auto no-scrollbar gap-2 w-full xl:w-auto pb-2 xl:pb-0">
                {availableTabs.length > 0 ? availableTabs.map(tab => (
                   <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeTab === tab ? `bg-slate-800 text-white border-slate-800 shadow-md transform scale-105` : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50`}`}>
                     {CATEGORY_CONFIG[tab].label}
                   </button>
                )) : <div className="text-sm text-slate-400 italic px-2">No categories yet</div>}
               </div>

               {/* Right: Search, Filters & Add */}
               <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                 
                 {/* Search */}
                 <div className="relative group w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={16} />
                    <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                 </div>

                 <div className="flex gap-2 w-full sm:w-auto">
                    {/* --- FILTERS RESTORED HERE --- */}
                    <div className="hidden md:flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                      <select value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)} className="p-2 text-xs bg-transparent outline-none text-slate-600 font-medium cursor-pointer hover:text-indigo-600">
                         <option value="All">All Quarters</option>
                         <option value="Q1">Q1</option>
                         <option value="Q2">Q2</option>
                         <option value="Q3">Q3</option>
                         <option value="Q4">Q4</option>
                      </select>
                      <div className="w-px bg-slate-200 my-1"></div>
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 text-xs bg-transparent outline-none text-slate-600 font-medium cursor-pointer hover:text-indigo-600">
                         <option value="All">All Status</option>
                         <option value="Active">Active</option>
                         <option value="Completed">Completed</option>
                      </select>
                    </div>
                    {/* ----------------------------- */}

                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 whitespace-nowrap">
                        <Plus size={18} /> <span className="hidden sm:inline">New Goal</span>
                    </button>
                 </div>
               </div>
            </div>

            {/* Grid */}
            <div className="min-h-[400px]">
              {visibleObjectives.length === 0 ? (
                <div className="text-center py-20 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                     <Search className="text-slate-300" size={24} />
                  </div>
                  <h3 className="text-slate-600 font-medium">No matches found</h3>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {visibleObjectives.map(obj => (
                    <div key={obj.id} className="h-full">
                      <ObjectiveCard 
                        objective={obj} 
                        onQuickLog={(kr) => setQuickLogKR(kr)}
                        onRefresh={handleRefresh}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <DailyLogView objectives={objectives} onRefresh={handleRefresh} />
        )}
      </main>

      <AddObjectiveModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddObjective}
      />
      
      <QuickLogModal 
        isOpen={!!quickLogKR} 
        onClose={() => setQuickLogKR(null)}
        kr={quickLogKR}
        objectives={objectives}
        onRefresh={() => { handleRefresh(); toast.success("Log Saved"); }}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}