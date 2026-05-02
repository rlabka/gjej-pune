'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  getEmailTemplates,
  updateEmailTemplate,
  type EmailTemplate,
  type EmailTemplateId
} from '@/data/mockAdminEmailTemplates';

const TEMPLATE_KEYS: Record<EmailTemplateId, string> = {
  registration: 'registration',
  premium_activation: 'premiumActivation',
  hidden_message_notification: 'hiddenMessageNotification'
};

export default function AdminEmailTemplatesPage() {
  const t = useTranslations('Admin.emailTemplatesPage');
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => getEmailTemplates());
  const [selectedId, setSelectedId] = useState<EmailTemplateId | null>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => setTemplates(getEmailTemplates()), []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = templates.find((x) => x.id === selectedId);

  const openEditor = (t: EmailTemplate) => {
    setSelectedId(t.id);
    setSubject(t.subject);
    setBodyHtml(t.bodyHtml);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedId) return;
    updateEmailTemplate(selectedId, subject, bodyHtml);
    load();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#162C66]">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#162C66]">Templates</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {templates.map((tmpl) => (
              <li key={tmpl.id}>
                <button
                  type="button"
                  onClick={() => openEditor(tmpl)}
                  className={`w-full px-6 py-4 text-left font-medium text-slate-800 hover:bg-slate-50 transition-colors ${selectedId === tmpl.id ? 'bg-slate-100' : ''}`}
                >
                  {t(TEMPLATE_KEYS[tmpl.id])}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="lg:col-span-2">
          {selected ? (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#162C66]">{t(TEMPLATE_KEYS[selected.id])}</h2>
              <p className="text-xs text-slate-500">{t('updatedAt')}: {new Date(selected.updatedAt).toLocaleString()}</p>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1">{t('subject')}</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-300 outline-none"
                  aria-label={t('subject')}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1">{t('body')}</span>
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-slate-300 outline-none"
                  aria-label={t('body')}
                />
              </label>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="md" onClick={handleSave}>{t('save')}</Button>
                {saved && <span className="text-sm font-medium text-emerald-600">{t('savedSuccess')}</span>}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-500">
              Select a template to edit.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
