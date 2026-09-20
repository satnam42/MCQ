import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSystemSettings, updateNewContentDurationDays } from '../services/api';
import { Settings, User, ShieldCheck, Clock, Save, Monitor, Bell, CheckCircle } from 'lucide-react';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const [newContentDays, setNewContentDays] = useState(7);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      const fetchSettings = async () => {
        try {
          const data = await getSystemSettings();
          if (data.success && data.data?.settings?.new_content_duration_days) {
            setNewContentDays(parseInt(data.data.settings.new_content_duration_days, 10));
          }
        } catch (err) {
          console.error('Failed to fetch system settings:', err);
        }
      };
      fetchSettings();
    }
  }, [isAdmin]);

  const handleSaveDurationSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMessage('');
    try {
      const res = await updateNewContentDurationDays(newContentDays);
      if (res.success) {
        setSettingsMessage('Settings saved successfully!');
        setTimeout(() => setSettingsMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setSettingsMessage('Failed to save setting.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Account & Platform Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your personal profile, practice preferences, and system configurations.
          </p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <User className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">User Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Full Name</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
              {user?.name || 'User'}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
              {user?.email || 'N/A'}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Account Role</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold capitalize flex items-center space-x-2">
              {isAdmin ? (
                <span className="text-purple-700 flex items-center font-bold">
                  <ShieldCheck className="w-4 h-4 mr-1 text-purple-600" /> Administrator
                </span>
              ) : (
                <span className="text-slate-700 font-bold">Candidate User</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Account ID</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600">
              #{user?.id || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Admin System Settings Section */}
      {isAdmin && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-purple-100">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">System Admin Settings</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Dynamic "NEW" Tag Duration</span>
              </div>
              <p className="text-xs text-slate-600">
                Configure how long newly created questions and topics show the dynamic <span className="font-bold text-purple-700">[NEW]</span> tag across practice views.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <select
                value={newContentDays}
                onChange={(e) => setNewContentDays(parseInt(e.target.value, 10))}
                className="px-3.5 py-2 rounded-xl border border-purple-300 text-xs sm:text-sm font-bold bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Default)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>

              <button
                onClick={handleSaveDurationSettings}
                disabled={isSavingSettings}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>

          {settingsMessage && (
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              <span>{settingsMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <Monitor className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">Platform Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">Primary Language</div>
              <div className="text-xs text-slate-500">Punjabi (Gurmukhi) & English translation supported</div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">Punjabi</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">Responsive Layout</div>
              <div className="text-xs text-slate-500">Left Sidebar with collapse & mobile drawer</div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">Active</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
