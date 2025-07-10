import React from 'react';

interface VisualCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const VisualCard: React.FC<VisualCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`
      bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 
      rounded-xl p-6 shadow-lg hover:shadow-xl
      transition-all duration-300 ease-in-out
      hover:border-slate-600/50 hover:bg-slate-800/70
      ${className}
    `}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700/50 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};