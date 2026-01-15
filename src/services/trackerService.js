import { 
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase'; // Direct auth import
import { calculateProgress } from '../utils/helpers';

const STORAGE_KEYS = {
  OBJECTIVES: 'okr_objectives',
  LOGS: 'okr_logs'
};

// --- Local Helpers ---
const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  // --- SMART SYNC ENGINE (Two-Way Merge) ---
  syncFull: async (uid) => {
    if (!uid) return;
    try {
      console.log("Starting Smart Sync...");
      
      // 1. Get All Data
      const localObjs = getLocal(STORAGE_KEYS.OBJECTIVES);
      const localLogs = getLocal(STORAGE_KEYS.LOGS);

      const cloudObjsSnap = await getDocs(collection(db, `users/${uid}/objectives`));
      const cloudLogsSnap = await getDocs(collection(db, `users/${uid}/logs`));
      
      const cloudObjs = cloudObjsSnap.docs.map(d => d.data());
      const cloudLogs = cloudLogsSnap.docs.map(d => d.data());

      // 2. Prepare for Batch Upload (Local -> Cloud)
      const batch = writeBatch(db);
      let hasUploads = false;

      // 3. Merge Objectives
      // Start with Cloud data as base
      const finalObjs = [...cloudObjs];
      
      // Find local items NOT in cloud -> Add to Final list AND Schedule upload
      localObjs.forEach(lObj => {
        const existsInCloud = cloudObjs.find(c => c.id === lObj.id);
        if (!existsInCloud) {
          finalObjs.push(lObj); // Keep locally
          const ref = doc(db, `users/${uid}/objectives`, lObj.id);
          batch.set(ref, lObj); // Send to cloud
          hasUploads = true;
        } else {
          // CONFLICT RESOLUTION: If both exist, we could check timestamps.
          // For simplicity in this version, Cloud wins if ID matches.
          // (You can add logic here to keep the one with newer 'updatedAt')
        }
      });

      // 4. Merge Logs
      const finalLogs = [...cloudLogs];
      
      localLogs.forEach(lLog => {
        const existsInCloud = cloudLogs.find(c => c.id === lLog.id);
        if (!existsInCloud) {
          finalLogs.push(lLog);
          const ref = doc(db, `users/${uid}/logs`, lLog.id);
          batch.set(ref, lLog);
          hasUploads = true;
        }
      });

      // 5. Commit Uploads to Firestore
      if (hasUploads) {
        await batch.commit();
        console.log("Uploaded local data to cloud.");
      }

      // 6. Save Merged Set to Local Storage
      // Sort objectives by creation date to keep UI consistent
      finalObjs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      finalLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setLocal(STORAGE_KEYS.OBJECTIVES, finalObjs);
      setLocal(STORAGE_KEYS.LOGS, finalLogs);

      return { objectives: finalObjs, logs: finalLogs };

    } catch (e) {
      console.error("Sync Error:", e);
      throw e;
    }
  },

  // --- CRUD OPERATIONS (Auto-Sync) ---

  getObjectives: async () => {
    return getLocal(STORAGE_KEYS.OBJECTIVES);
  },

  addObjective: async (data) => {
    const newObj = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    
    // Local
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    setLocal(STORAGE_KEYS.OBJECTIVES, [newObj, ...objectives]);

    // Cloud
    const uid = auth.currentUser?.uid;
    if (uid) {
      setDoc(doc(db, `users/${uid}/objectives`, newObj.id), newObj).catch(console.error);
    }
    
    return newObj;
  },

  updateObjective: async (id, data) => {
    // Local
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    const updated = objectives.map(obj => obj.id === id ? { ...obj, ...data } : obj);
    setLocal(STORAGE_KEYS.OBJECTIVES, updated);

    // Cloud
    const uid = auth.currentUser?.uid;
    if (uid) {
      const objToSave = updated.find(o => o.id === id);
      setDoc(doc(db, `users/${uid}/objectives`, id), objToSave).catch(console.error);
    }
  },

  deleteObjective: async (id) => {
    // Local
    const objectives = getLocal(STORAGE_KEYS.OBJECTIVES);
    setLocal(STORAGE_KEYS.OBJECTIVES, objectives.filter(o => o.id !== id));

    // Cloud
    const uid = auth.currentUser?.uid;
    if (uid) {
      deleteDoc(doc(db, `users/${uid}/objectives`, id)).catch(console.error);
    }
  },

  getLogs: async () => {
    return getLocal(STORAGE_KEYS.LOGS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  handleLogAndProgress: async (content, date, krId, delta, objectives) => {
    const uid = auth.currentUser?.uid;
    
    // 1. Log Entry
    const logs = getLocal(STORAGE_KEYS.LOGS);
    const newLog = {
      id: crypto.randomUUID(),
      content, date, linkedKRId: krId || null, progressDelta: delta || 0,
      createdAt: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.LOGS, [newLog, ...logs]);
    if (uid) setDoc(doc(db, `users/${uid}/logs`, newLog.id), newLog).catch(console.error);

    // 2. KR Update (if needed)
    if (krId && delta !== 0) {
       let allObjs = [...objectives]; // Use passed state for speed, or fetch local
       const objIndex = allObjs.findIndex(obj => obj.keyResults?.some(kr => kr.id === krId));
       
       if (objIndex > -1) {
         const objective = { ...allObjs[objIndex] };
         const updatedKRs = objective.keyResults.map(kr => {
            if (kr.id === krId) return { ...kr, current: (parseFloat(kr.current)||0) + parseFloat(delta) };
            return kr;
         });
         
         const newProgress = calculateProgress(updatedKRs);
         let newStatus = objective.status;
         if (newProgress >= 100) newStatus = 'Completed';
         else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress';

         objective.keyResults = updatedKRs;
         objective.status = newStatus;
         
         // Update Array
         allObjs[objIndex] = objective;
         
         // Save Local & Cloud
         setLocal(STORAGE_KEYS.OBJECTIVES, allObjs);
         if (uid) setDoc(doc(db, `users/${uid}/objectives`, objective.id), objective).catch(console.error);
       }
    }
  }
};