'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  getEmployerConfig,
  setEmployerConfig,
  resetEmployerConfig,
  type EmployerConfig
} from '@/lib/siteConfig';

export default function AdminEmployerPage() {
  const t = useTranslations('Admin');
  const [config, setConfig] = useState<EmployerConfig>(getEmployerConfig());
  const [saved, setSaved] = useState(false);

  const loadConfig = useCallback(() => {
    setConfig(getEmployerConfig());
  }, []);

  useEffect(() => {
    loadConfig();
    const handler = () => loadConfig();
    window.addEventListener('site-config-updated', handler);
    return () => window.removeEventListener('site-config-updated', handler);
  }, [loadConfig]);

  const handleSave = () => {
    setEmployerConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetEmployerConfig();
    loadConfig();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#162C66]">{t('employerSection')}</h2>
        <p className="text-slate-600 mt-1">Control visibility and options for the employer dashboard and related pages.</p>
      </div>

      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">{t('dashboardSections')}</h3>
        <div className="space-y-3">
          {[
            { key: 'overviewMetrics' as const, label: t('overviewMetrics') },
            { key: 'recentCandidates' as const, label: t('recentCandidates') },
            { key: 'jobList' as const, label: t('jobList') }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.dashboard[key]}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    dashboard: { ...c.dashboard, [key]: e.target.checked }
                  }))
                }
                className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
              />
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">Features</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.applicationsPipeline}
              onChange={(e) => setConfig((c) => ({ ...c, applicationsPipeline: e.target.checked }))}
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('applicationsPipeline')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.companyPage}
              onChange={(e) => setConfig((c) => ({ ...c, companyPage: e.target.checked }))}
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('companyPage')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.messages}
              onChange={(e) => setConfig((c) => ({ ...c, messages: e.target.checked }))}
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('messages')}</span>
          </label>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button variant="primary" onClick={handleSave}>
          {saved ? 'Saved!' : t('save')}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          {t('reset')}
        </Button>
      </div>
    </div>
  );
}
