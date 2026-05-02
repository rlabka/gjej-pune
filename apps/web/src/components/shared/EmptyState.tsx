import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-8 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#0B1F44] mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
