import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
  icon?: ReactNode;
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  action,
  titleClassName,
  subtitleClassName,
  icon
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-[#162C66]/[0.06] text-[#162C66] flex items-center justify-center shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div>
          <h2 className={clsx("text-2xl lg:text-3xl font-extrabold text-[#0B1F44] tracking-tight mb-1", titleClassName)}>
            {title}
          </h2>
          {subtitle && (
            <p className={clsx("text-sm text-slate-500 font-medium max-w-2xl leading-relaxed", subtitleClassName)}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
