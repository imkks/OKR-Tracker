import React from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { logoutUser } from '../../config/firebase';

const UserMenu = ({ user, onOpenAuth }) => {
  if (user) {
    // Fallback if user registered without a name or display name failed
    const displayName = user.displayName || user.email.split('@')[0];
    
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-bold text-slate-700">{displayName}</div>
          <div className="text-xs text-slate-500">Synced</div>
        </div>
        
        {/* Avatar: Use User Icon if no photoURL (common with Email auth) */}
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-slate-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <UserIcon size={16} />
          </div>
        )}

        <button 
          onClick={logoutUser}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={onOpenAuth}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 text-sm font-medium transition-all shadow-sm"
    >
      <LogIn size={16} />
      <span>Sign In / Sync</span>
    </button>
  );
};

export default UserMenu;