import Card from '../ui/Card';
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: 'navy' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue';
}

const iconColorMap = {
  navy: 'bg-[#162C66]/[0.08] text-[#162C66]',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  blue: 'bg-blue-50 text-blue-600',
};

export default function MetricCard({ label, value, icon, trend, iconColor = 'navy' }: MetricCardProps) {
  return (
    <Card className="group flex items-center gap-4 p-5 sm:p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[2px] transition-all duration-300 cursor-default">
      <div className={clsx(
        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
        iconColorMap[iconColor]
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider leading-tight mb-1.5 truncate" title={label}>
          {label}
        </p>
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1F44] tracking-tight leading-none tabular-nums">
            {value}
          </h3>
          {trend && (
            <span className={clsx(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap",
              trend.isPositive 
                ? "bg-emerald-50 text-emerald-600" 
                : "bg-rose-50 text-rose-600"
            )}>
              {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
