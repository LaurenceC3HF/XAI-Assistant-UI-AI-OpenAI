import React from 'react';

interface VisualCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const VisualCard: React.FC<VisualCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`border border-gray-600 bg-[#121212] p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700/50 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};