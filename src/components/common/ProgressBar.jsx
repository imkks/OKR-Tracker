import React from 'react';

const ProgressBar = ({ percentage, colorClass = "bg-indigo-600" }) => (
  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
    <div 
      className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
      style={{ width: `${percentage}%` }}
    ></div>
  </div>
);

export default ProgressBar;