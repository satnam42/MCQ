import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  User,
  CheckCircle,
  AlertCircle,
  Power,
  Layers,
  BarChart3,
  Clock,
  History,
  Save,
  RefreshCw,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';
import mockTestService from '../../services/mockTestService';
import noteService from '../../services/noteService';
import api from '../../services/api';

const SIZES = [10, 25, 50, 100, 150];

const AdminMockTestPage = () => {
  const [activeTab, setActiveTab] = useState('settings');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Global Settings State
  const [enabled, setEnabled] = useState(true);
  const [allowedQuestionCounts, setAllowedQuestionCounts] = useState([10, 25, 50, 100, 150]);
  const [allowCustom, setAllowCustom] = useState(true);
  const [maxQuestions, setMaxQuestions] = useState(150);
  const [dailyGlobalLimit, setDailyGlobalLimit] = useState(3);
  const [weeklyGlobalLimit, setWeeklyGlobalLimit] = useState(15);
  const [monthlyGlobalLimit, setMonthlyGlobalLimit] = useState(50);
  const [selectionMode, setSelectionMode] = useState('new');
  const [preventDuplicates, setPreventDuplicates] = useState(true);

  // Topics & Topic Maximums
  const [topicsList, setTopicsList] = useState([]);
  const [disabledTopicIds, setDisabledTopicIds] = useState([]);
  const [topicMaxMap, setTopicMaxMap] = useState({});

  // Users & Permissions State
  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [editUserPermission, setEditUserPermission] = useState(true);
  const [editUserDailyLimit, setEditUserDailyLimit] = useState('3');

  // Stats & Audit Logs
  const [dashboardStats, setDashboardStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [settingsRes, topicsRes, statsRes, logsRes, usersRes] = await Promise.all([
        mockTestService.getAdminSettings(),
        noteService.getTopics(),
        mockTestService.getDashboardStats().catch(() => ({ data: { stats: null } })),
        mockTestService.getAuditLogs().catch(() => ({ data: { logs: [] } })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
      ]);

      if (settingsRes && settingsRes.data && settingsRes.data.settings) {
        const s = settingsRes.data.settings;
        setEnabled(s.enabled);
        setAllowedQuestionCounts(s.allowedQuestionCounts || [10, 25, 50, 100, 150]);
        setAllowCustom(s.allowCustom);
        setMaxQuestions(s.maxQuestions || 150);
        setDailyGlobalLimit(s.dailyGlobalLimit);
        setWeeklyGlobalLimit(s.weeklyGlobalLimit);
        setMonthlyGlobalLimit(s.monthlyGlobalLimit);
        setSelectionMode(s.selectionMode || 'new');
        setPreventDuplicates(s.preventDuplicates);
        setDisabledTopicIds(s.disabledTopicIds || []);
        setTopicMaxMap(s.topicMaxMap || {});
      }

      if (topicsRes && topicsRes.data && topicsRes.data.topics) {
        setTopicsList(topicsRes.data.topics);
      }

      if (statsRes && statsRes.data && statsRes.data.stats) {
        setDashboardStats(statsRes.data.stats);
      }

      if (logsRes && logsRes.data && logsRes.data.logs) {
        setAuditLogs(logsRes.data.logs);
      }

      if (usersRes && usersRes.data) {
        const list = usersRes.data.users || usersRes.data.data?.users || usersRes.data.data || [];
        if (Array.isArray(list)) setUsersList(list);
      }
    } catch (err) {
      console.error('Error fetching admin mock settings:', err);
      setErrorMsg('Failed to load mock test settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSize = (sz) => {
    if (allowedQuestionCounts.includes(sz)) {
      setAllowedQuestionCounts(allowedQuestionCounts.filter((s) => s !== sz));
    } else {
      setAllowedQuestionCounts([...allowedQuestionCounts, sz].sort((a, b) => a - b));
    }
  };

  const handleToggleTopicDisabled = (topicId) => {
    if (disabledTopicIds.includes(topicId)) {
      setDisabledTopicIds(disabledTopicIds.filter((id) => id !== topicId));
    } else {
      setDisabledTopicIds([...disabledTopicIds, topicId]);
    }
  };

  const handleTopicMaxChange = (topicId, val) => {
    setTopicMaxMap((prev) => ({
      ...prev,
      [topicId]: val,
    }));
  };

  const handleSaveGlobalSettings = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        enabled,
        allowedQuestionCounts,
        allowCustom,
        maxQuestions: parseInt(maxQuestions, 10) || 150,
        dailyGlobalLimit,
        weeklyGlobalLimit,
        monthlyGlobalLimit,
        selectionMode,
        preventDuplicates,
        disabledTopicIds,
        topicMaxMap,
      };

      const res = await mockTestService.updateAdminSettings(payload);
      if (res && res.data) {
        setSuccessMsg('✅ Mock Test settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchInitialData();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUserEdit = (user) => {
    setSelectedUserForEdit(user);
    setEditUserPermission(user.role === 'admin' || true);
    setEditUserDailyLimit('3');
  };

  const handleSaveUserPermission = async () => {
    if (!selectedUserForEdit) return;
    try {
      await mockTestService.updateUserPermission(selectedUserForEdit.id, {
        canAccessMockTest: editUserPermission,
      });
      await mockTestService.updateUserLimit(selectedUserForEdit.id, {
        dailyLimit: editUserDailyLimit,
      });
      setSuccessMsg(`✅ Updated permissions for User #${selectedUserForEdit.id}`);
      setSelectedUserForEdit(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user permissions.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              <span>Admin Management Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold font-gurmukhi tracking-tight">
              Mock Test Management (ਮੋਕ ਟੈਸਟ ਪ੍ਰਬੰਧਨ)
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-gurmukhi">
              Configure global features, allowed question counts, limits, topics availability, user permissions, and audit logs.
            </p>
          </div>
          <button
            onClick={fetchInitialData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            title="Refresh Settings"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-3 text-sm font-semibold font-gurmukhi">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center space-x-3 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 font-gurmukhi">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 inline mr-1.5" />
          Global Settings & Limits
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'topics'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 inline mr-1.5" />
          Topics Availability & Max
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-1.5" />
          User Permissions & Overrides
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1.5" />
          Dashboard Stats & Audit Logs
        </button>
      </div>

      {/* ── TAB 1: GLOBAL SETTINGS & LIMITS ── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8 font-gurmukhi">
          {/* Feature ON/OFF */}
          <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Mock Test Feature Toggle</h3>
              <p className="text-xs text-slate-500">Globally enable or disable mock test access across frontend and backend APIs.</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                enabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{enabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}</span>
            </button>
          </div>

          {/* Allowed Sizes */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">Allowed Mock Test Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleToggleSize(sz)}
                  className={`px-4 py-2.5 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
                    allowedQuestionCounts.includes(sz)
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ✓ {sz} Questions
                </button>
              ))}

              <button
                type="button"
                onClick={() => setAllowCustom(!allowCustom)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  allowCustom ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✓ Custom Size
              </button>
            </div>
          </div>

          {/* Max Questions & Global Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Max Questions Per Mock</label>
              <input
                type="number"
                min={10}
                max={500}
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Daily Global Limit</label>
              <input
                type="text"
                value={dailyGlobalLimit}
                onChange={(e) => setDailyGlobalLimit(e.target.value)}
                placeholder="e.g. 3 or unlimited"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Weekly Global Limit</label>
              <input
                type="text"
                value={weeklyGlobalLimit}
                onChange={(e) => setWeeklyGlobalLimit(e.target.value)}
                placeholder="e.g. 15 or unlimited"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Monthly Global Limit</label>
              <input
                type="text"
                value={monthlyGlobalLimit}
                onChange={(e) => setMonthlyGlobalLimit(e.target.value)}
                placeholder="e.g. 50 or unlimited"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
              />
            </div>
          </div>

          {/* Question Selection & Duplicate Prevention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">Default Question Selection Rule</label>
              <select
                value={selectionMode}
                onChange={(e) => setSelectionMode(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-white"
              >
                <option value="new">Only New Questions (ਕੇਵਲ ਨਵੇਂ ਪ੍ਰਸ਼ਨ)</option>
                <option value="all">Allow All Questions (ਸਾਰੇ ਪ੍ਰਸ਼ਨ)</option>
                <option value="include_attempted">Include Attempted Questions</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <span className="font-bold text-sm text-slate-900 block">Prevent Duplicate Questions</span>
                <span className="text-xs text-slate-500">Keep duplicate prevention ON by default</span>
              </div>
              <button
                type="button"
                onClick={() => setPreventDuplicates(!preventDuplicates)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  preventDuplicates ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {preventDuplicates ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveGlobalSettings}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md text-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: TOPICS AVAILABILITY & MAX LIMITS ── */}
      {activeTab === 'topics' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 font-gurmukhi">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Mock Test Topic Availability</h3>
              <p className="text-xs text-slate-500">Enable/disable topics and set topic-level maximum question limits for mock tests.</p>
            </div>
          </div>

          <div className="space-y-3">
            {topicsList.map((t) => {
              const isDisabled = disabledTopicIds.includes(t.id);
              const maxVal = topicMaxMap[t.id] !== undefined ? topicMaxMap[t.id] : '';
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTopicDisabled(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        !isDisabled ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {!isDisabled ? '✓ Available' : '✗ Disabled'}
                    </button>
                    <span className="font-bold text-sm text-slate-900">{t.name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600">Topic Max Questions:</span>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={maxVal}
                      onChange={(e) => handleTopicMaxChange(t.id, e.target.value)}
                      className="w-24 px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-bold text-right"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveGlobalSettings}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md text-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Topic Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: USER PERMISSIONS & OVERRIDES ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 font-gurmukhi">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">User Permissions & Limits</h3>
              <p className="text-xs text-slate-500">Enable/disable mock test for individual users and override usage limits.</p>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Mock Test Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{user.name}</div>
                      <div className="text-xs text-slate-400 font-mono font-normal">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded-md font-bold text-xs">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-xs">
                        Enabled
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenUserEdit(user)}
                        className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs hover:bg-amber-200 cursor-pointer"
                      >
                        Edit Permission & Limit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Edit Modal */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base">
                  User: {selectedUserForEdit.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedUserForEdit.email}</p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-800">Mock Test Access</span>
                    <button
                      type="button"
                      onClick={() => setEditUserPermission(!editUserPermission)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        editUserPermission ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {editUserPermission ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Daily Limit Override</label>
                    <input
                      type="text"
                      value={editUserDailyLimit}
                      onChange={(e) => setEditUserDailyLimit(e.target.value)}
                      placeholder="e.g. 10 or unlimited"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserPermission}
                    className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Save User Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DASHBOARD STATS & AUDIT LOGS ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 font-gurmukhi">
          {/* Dashboard Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mock Tests Today</span>
              <div className="text-3xl font-black text-amber-950 font-mono">
                {dashboardStats ? dashboardStats.mockTestsToday : 0}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mock Tests This Week</span>
              <div className="text-3xl font-black text-amber-950 font-mono">
                {dashboardStats ? dashboardStats.mockTestsThisWeek : 0}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions Attempted</span>
              <div className="text-3xl font-black text-amber-950 font-mono">
                {dashboardStats ? dashboardStats.questionsAttempted.toLocaleString() : 0}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Mock Users</span>
              <div className="text-3xl font-black text-amber-950 font-mono">
                {dashboardStats ? dashboardStats.activeMockUsers : 0}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-600" />
              <span>Admin Audit Log</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-xs">
                    <th className="py-3 px-4">Admin User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 font-gurmukhi">{log.adminName}</td>
                      <td className="py-3 px-4 font-bold text-amber-900">{log.action}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-md truncate">{log.details}</td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMockTestPage;
