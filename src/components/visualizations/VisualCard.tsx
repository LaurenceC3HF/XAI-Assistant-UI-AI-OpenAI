import React from 'react';

interface VisualCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const VisualCard: React.FC<VisualCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`
      bg-intel-gray/50 backdrop-blur-sm border border-intel-gray
      rounded-xl p-6 shadow-lg hover:shadow-xl
      transition-all duration-300 ease-in-out
      hover:border-intel-cyan/50 hover:bg-intel-gray/70
      ${className}
    `}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-intel-gray pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};