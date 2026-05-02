'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  getJobSeekerConfig,
  setJobSeekerConfig,
  resetJobSeekerConfig,
  type JobSeekerConfig
} from '@/lib/siteConfig';
import { Plus, X } from 'lucide-react';

export default function AdminJobSeekerPage() {
  const t = useTranslations('Admin');
  const [config, setConfig] = useState<JobSeekerConfig>(getJobSeekerConfig());
  const [saved, setSaved] = useState(false);
  const [newBanEmail, setNewBanEmail] = useState('');

  const loadConfig = useCallback(() => {
    setConfig(getJobSeekerConfig());
  }, []);

  useEffect(() => {
    loadConfig();
    const handler = () => loadConfig();
    window.addEventListener('site-config-updated', handler);
    return () => window.removeEventListener('site-config-updated', handler);
  }, [loadConfig]);

  const handleSave = () => {
    setJobSeekerConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetJobSeekerConfig();
    loadConfig();
  };

  const addBannedEmail = () => {
    const email = newBanEmail.trim().toLowerCase();
    if (!email || config.access.bannedEmails.includes(email)) return;
    setConfig((c) => ({
      ...c,
      access: {
        ...c.access,
        bannedEmails: [...c.access.bannedEmails, email]
      }
    }));
    setNewBanEmail('');
  };

  const removeBannedEmail = (email: string) => {
    setConfig((c) => ({
      ...c,
      access: {
        ...c.access,
        bannedEmails: c.access.bannedEmails.filter((e) => e !== email)
      }
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#162C66]">{t('jobSeekerSection')}</h2>
        <p className="text-slate-600 mt-1">
          Control access, visibility, and options for job-seeker registration, login, dashboard, and jobs page.
        </p>
      </div>

      {/* Access & moderation */}
      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">{t('accessSection')}</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.access.allowRegistration}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  access: { ...c.access, allowRegistration: e.target.checked }
                }))
              }
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('allowRegistration')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.access.allowLogin}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  access: { ...c.access, allowLogin: e.target.checked }
                }))
              }
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('allowLogin')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.access.allowDeleteOwnAccount}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  access: { ...c.access, allowDeleteOwnAccount: e.target.checked }
                }))
              }
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('allowDeleteOwnAccount')}</span>
          </label>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">{t('bannedEmails')}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.access.bannedEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-800 text-sm font-medium"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeBannedEmail(email)}
                    className="p-0.5 rounded hover:bg-red-100 text-red-600"
                    aria-label={`Remove ${email} from ban list`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newBanEmail}
                onChange={(e) => setNewBanEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBannedEmail())}
                placeholder={t('bannedEmailsPlaceholder')}
                className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <Button type="button" variant="outline" size="md" onClick={addBannedEmail}>
                <Plus size={16} className="mr-1" />
                {t('addBanEmail')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature visibility */}
      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">{t('featuresSection')}</h3>
        <div className="space-y-3">
          {[
            { key: 'showMessages' as const, label: t('showMessagesSection') },
            { key: 'showSavedJobs' as const, label: t('showSavedJobsSection') },
            { key: 'showApplications' as const, label: t('showApplicationsSection') },
            { key: 'showProfile' as const, label: t('showProfileSection') },
            { key: 'allowApplyToJobs' as const, label: t('allowApplyToJobs') },
            { key: 'allowSaveJobs' as const, label: t('allowSaveJobs') }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.features[key]}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    features: { ...c.features, [key]: e.target.checked }
                  }))
                }
                className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
              />
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Dashboard sections */}
      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">{t('dashboardSections')}</h3>
        <div className="space-y-3">
          {[
            { key: 'recommendedJobs' as const, label: t('recommendedJobs') },
            { key: 'recentApplications' as const, label: t('recentApplications') },
            { key: 'profileCompletion' as const, label: t('profileCompletion') },
            { key: 'metrics' as const, label: t('metrics') }
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

      {/* Jobs search page */}
      <Card>
        <h3 className="text-lg font-black text-[#162C66] mb-4">{t('jobsPage')}</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.jobsPage.showFilters}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  jobsPage: { ...c.jobsPage, showFilters: e.target.checked }
                }))
              }
              className="w-5 h-5 rounded text-[#F5C400] border-slate-300 focus:ring-[#F5C400]"
            />
            <span className="text-sm font-medium text-slate-700">{t('showFilters')}</span>
          </label>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">{t('resultsPerPage')}</label>
            <input
              type="number"
              min={5}
              max={50}
              value={config.jobsPage.resultsPerPage}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  jobsPage: { ...c.jobsPage, resultsPerPage: parseInt(e.target.value, 10) || 10 }
                }))
              }
              className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">{t('defaultSort')}</label>
            <select
              value={config.jobsPage.defaultSort}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  jobsPage: { ...c.jobsPage, defaultSort: e.target.value as 'relevance' | 'date' }
                }))
              }
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
            </select>
          </div>
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
