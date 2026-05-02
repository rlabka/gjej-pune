'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/auth';
import {
  Users,
  UserPlus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Send,
  Settings,
  KeyRound,
} from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Tab = 'admins' | 'profile' | 'email';

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

interface EmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  encryption: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('admins');
  const [loading, setLoading] = useState(true);

  // Admin management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Profile
  const [profileEmail, setProfileEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPw, setNewPw] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  // Email settings
  const [emailSettings, setEmailSettings] = useState<EmailSettingsData>({
    smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
    fromName: 'gjej-pune.com', fromEmail: 'noreply@gjej-pune.com', encryption: 'tls',
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const headers = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Load admins
  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setAdmins(data.admins);
      }
    } catch (err) {
      console.error('[Settings] Load admins error:', err);
    }
  }, [headers]);

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/profile`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.profile) {
          setProfileEmail(data.profile.email || '');
          setProfileName(data.profile.displayName || '');
        }
      }
    } catch (err) {
      console.error('[Settings] Load profile error:', err);
    }
  }, [headers]);

  // Load email settings
  const loadEmailSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.settings) {
          setEmailSettings({
            smtpHost: data.settings.smtpHost || '',
            smtpPort: data.settings.smtpPort || 587,
            smtpUser: data.settings.smtpUser || '',
            smtpPass: data.settings.smtpPass || '',
            fromName: data.settings.fromName || 'gjej-pune.com',
            fromEmail: data.settings.fromEmail || 'noreply@gjej-pune.com',
            encryption: data.settings.encryption || 'tls',
          });
        }
      }
    } catch (err) {
      console.error('[Settings] Load email settings error:', err);
    }
  }, [headers]);

  useEffect(() => {
    Promise.all([loadAdmins(), loadProfile(), loadEmailSettings()]).finally(() => setLoading(false));
  }, [loadAdmins, loadProfile, loadEmailSettings]);

  // Create admin
  const handleCreateAdmin = async () => {
    setAdminError('');
    setAdminSuccess('');
    if (!newEmail || !newPassword) {
      setAdminError('E-Mail und Passwort erforderlich');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: newEmail, password: newPassword, displayName: newName }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminSuccess('Admin erfolgreich erstellt');
        setNewEmail(''); setNewPassword(''); setNewName('');
        loadAdmins();
        setTimeout(() => setAdminSuccess(''), 3000);
      } else {
        setAdminError(data.error || 'Fehler beim Erstellen');
      }
    } catch { setAdminError('Netzwerkfehler'); }
    finally { setCreating(false); }
  };

  // Delete admin
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Admin wirklich löschen?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      const data = await res.json();
      if (data.ok) loadAdmins();
      else setAdminError(data.error || 'Fehler beim Löschen');
    } catch { setAdminError('Netzwerkfehler'); }
  };

  // Save profile
  const handleSaveProfile = async () => {
    setProfileMsg('');
    setProfileSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ email: profileEmail, displayName: profileName }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfileMsg('Profil gespeichert');
        setTimeout(() => setProfileMsg(''), 3000);
      } else {
        setProfileMsg(data.error || 'Fehler');
      }
    } catch { setProfileMsg('Netzwerkfehler'); }
    finally { setProfileSaving(false); }
  };

  // Change password
  const handleChangePassword = async () => {
    setPwMsg('');
    if (!currentPassword || !newPw) { setPwMsg('Beide Felder erforderlich'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/password`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ currentPassword, newPassword: newPw }),
      });
      const data = await res.json();
      if (data.ok) {
        setPwMsg('Passwort geändert');
        setCurrentPassword(''); setNewPw('');
        setTimeout(() => setPwMsg(''), 3000);
      } else {
        setPwMsg(data.error || 'Fehler');
      }
    } catch { setPwMsg('Netzwerkfehler'); }
    finally { setPwSaving(false); }
  };

  // Save email settings
  const handleSaveEmail = async () => {
    setEmailMsg('');
    setEmailSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(emailSettings),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailMsg('E-Mail-Einstellungen gespeichert');
        setTimeout(() => setEmailMsg(''), 3000);
      } else {
        setEmailMsg(data.error || 'Fehler');
      }
    } catch { setEmailMsg('Netzwerkfehler'); }
    finally { setEmailSaving(false); }
  };

  // Test email
  const handleTestEmail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings/test`, {
        method: 'POST',
        headers: headers(),
      });
      const data = await res.json();
      setEmailMsg(data.message || data.error || 'Test gesendet');
      setTimeout(() => setEmailMsg(''), 5000);
    } catch { setEmailMsg('Netzwerkfehler'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#162C66]" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'admins', label: 'Admin-Verwaltung', icon: Users },
    { id: 'profile', label: 'Mein Profil', icon: Shield },
    { id: 'email', label: 'E-Mail (SMTP)', icon: Mail },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-2">Einstellungen</h1>
        <p className="text-slate-500 font-medium">Admin-Verwaltung, Profil und E-Mail-Konfiguration</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 mb-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center space-x-2.5 px-5 py-3.5 rounded-2xl border font-bold text-sm transition-all',
              activeTab === id
                ? 'bg-white border-[#162C66] text-[#162C66] shadow-lg'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Admin Management */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Create Admin */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#162C66] flex items-center gap-2">
                <UserPlus size={20} /> Neuen Admin hinzufügen
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Admin Name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">E-Mail *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Passwort *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mind. 6 Zeichen"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
              </div>
              {adminError && <p className="text-sm text-red-500 font-medium">{adminError}</p>}
              {adminSuccess && <p className="text-sm text-green-500 font-medium">{adminSuccess}</p>}
              <button
                onClick={handleCreateAdmin}
                disabled={creating}
                className="flex items-center space-x-2 px-6 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md disabled:opacity-50"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                <span>Admin erstellen</span>
              </button>
            </div>
          </div>

          {/* Admin List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#162C66] flex items-center gap-2">
                <Users size={20} /> Administratoren ({admins.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between px-6 py-4 group">
                  <div>
                    <p className="font-bold text-[#162C66]">{admin.displayName || admin.email}</p>
                    <p className="text-sm text-slate-400">{admin.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Admin löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {admins.length === 0 && (
                <p className="px-6 py-8 text-center text-slate-400 text-sm">Keine Admins gefunden</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Edit Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#162C66] flex items-center gap-2">
                <Settings size={20} /> Profil bearbeiten
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Anzeigename</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">E-Mail</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
              </div>
              {profileMsg && (
                <p className={clsx('text-sm font-medium', profileMsg.includes('gespeichert') ? 'text-green-500' : 'text-red-500')}>
                  {profileMsg}
                </p>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md disabled:opacity-50"
              >
                {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Profil speichern</span>
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#162C66] flex items-center gap-2">
                <KeyRound size={20} /> Passwort ändern
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Aktuelles Passwort</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Neues Passwort</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Mind. 6 Zeichen"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
              </div>
              {pwMsg && (
                <p className={clsx('text-sm font-medium', pwMsg.includes('geändert') ? 'text-green-500' : 'text-red-500')}>
                  {pwMsg}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md disabled:opacity-50"
              >
                {pwSaving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Passwort ändern</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Email Settings */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#162C66] flex items-center gap-2">
              <Mail size={20} /> SMTP E-Mail-Einstellungen
            </h2>
            <p className="text-sm text-slate-400 mt-1">Konfigurieren Sie den E-Mail-Versand für die Plattform</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtpHost: e.target.value }))}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">SMTP Port</label>
                <input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtpPort: parseInt(e.target.value) || 587 }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">SMTP Benutzername</label>
                <input
                  type="text"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtpUser: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">SMTP Passwort</label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={emailSettings.smtpPass}
                    onChange={(e) => setEmailSettings((p) => ({ ...p, smtpPass: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Absender</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Absendername</label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings((p) => ({ ...p, fromName: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Absender-E-Mail</label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings((p) => ({ ...p, fromEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">Verschlüsselung</label>
                  <select
                    value={emailSettings.encryption}
                    onChange={(e) => setEmailSettings((p) => ({ ...p, encryption: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none bg-white"
                  >
                    <option value="tls">TLS (Port 587)</option>
                    <option value="ssl">SSL (Port 465)</option>
                    <option value="none">Keine</option>
                  </select>
                </div>
              </div>
            </div>

            {emailMsg && (
              <p className={clsx('text-sm font-medium', emailMsg.includes('gespeichert') || emailMsg.includes('konfiguriert') ? 'text-green-500' : 'text-amber-500')}>
                {emailMsg}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveEmail}
                disabled={emailSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md disabled:opacity-50"
              >
                {emailSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Speichern</span>
              </button>
              <button
                onClick={handleTestEmail}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                <Send size={16} />
                <span>Test-Mail senden</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
