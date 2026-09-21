import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Save, RefreshCw, CheckCircle, AlertCircle, UserCheck, ShieldCheck, Mail, Calendar, Lock, Sparkles, Ban, Sliders, Info, Clock, User as UserIcon } from 'lucide-react';

const TEST_TYPES = [
  { key: 'daily', name: 'Daily Test' },
  { key: 'practice', name: 'Practice Test' },
  { key: 'topic', name: 'Topic Test' },
  { key: 'mock', name: 'Full Mock Test' },
];

const OVERRIDE_TYPES = [
  { key: 'default', label: 'Default (Role Limit)' },
  { key: 'custom', label: 'Custom Limit' },
  { key: 'unlimited', label: 'Unlimited' },
  { key: 'blocked', label: 'Blocked' },
];

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'lifetime', label: 'Lifetime' },
];

const AdminUserTestLimits = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const [userLimits, setUserLimits] = useState({});
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Fetch user accounts
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      let userList = [];
      try {
        const res = await api.get('/auth/users');
        if (res.data?.success && Array.isArray(res.data.data?.users)) {
          userList = res.data.data.users;
        } else if (res.data?.success && Array.isArray(res.data.data)) {
          userList = res.data.data;
        }
      } catch {
        const fallbackRes = await api.get('/users');
        if (fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
          userList = fallbackRes.data.data;
        }
      }
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
      setMessage({ type: 'error', text: 'Could not load users list.' });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 2. Fetch specific user's limit overrides & effective quotas when selectedUser changes
  const fetchUserLimits = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingLimits(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get(`/test-limits/users/${userId}`);
      if (res.data?.success && res.data.data) {
        const dataObj = res.data.data;
        const rawOverrides = dataObj.overrides || dataObj.limits || [];
        const effectiveQuotas = dataObj.effectiveQuotas || dataObj.quotas || {};

        const updated = {};
        TEST_TYPES.forEach((tt) => {
          const overrideRecord = Array.isArray(rawOverrides)
            ? rawOverrides.find((l) => String(l.test_type || l.testType).toLowerCase() === tt.key)
            : rawOverrides[tt.key];

          const quotaObj = Array.isArray(effectiveQuotas)
            ? effectiveQuotas.find((q) => String(q.testType).toLowerCase() === tt.key)
            : effectiveQuotas[tt.key];

          let overrideType = 'default';
          if (overrideRecord && overrideRecord.override_type) {
            overrideType = String(overrideRecord.override_type).toLowerCase();
          } else if (overrideRecord && overrideRecord.overrideType) {
            overrideType = String(overrideRecord.overrideType).toLowerCase();
          }

          const customMax = overrideRecord?.custom_max_attempts ?? overrideRecord?.customMaxAttempts ?? overrideRecord?.limit;

          updated[tt.key] = {
            testType: tt.key,
            name: tt.name,
            overrideType,
            period: overrideRecord?.period || quotaObj?.period || 'daily',
            limit: customMax !== null && customMax !== undefined ? customMax : (quotaObj?.configuredLimit ?? 5),
            effectiveStatus: quotaObj?.status || 'limited',
            effectiveLimit: quotaObj?.isUnlimited ? 'Unlimited' : (quotaObj?.status === 'blocked' ? 'Blocked' : `${quotaObj?.configuredLimit ?? 2}/period`),
            roleDefaultLimit: quotaObj?.roleDefaultLimit !== undefined && quotaObj?.roleDefaultLimit !== null
              ? (quotaObj.roleDefaultLimit === -1 ? 'Unlimited' : `${quotaObj.roleDefaultLimit}/period`)
              : '2/period',
            source: quotaObj?.source === 'user_override' ? 'User Override' : (quotaObj?.source === 'role' ? 'Role Limit' : 'System Default'),
            updatedAt: quotaObj?.updatedAt || overrideRecord?.updated_at || overrideRecord?.updatedAt || null,
            updatedBy: quotaObj?.updatedBy || overrideRecord?.updated_by || null,
          };
        });

        setUserLimits(updated);
      }
    } catch (err) {
      console.warn('Could not load specific user overrides, using defaults:', err);
    } finally {
      setLoadingLimits(false);
    }
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserLimits(user.id);
  };

  const handleFieldChange = (testType, field, value) => {
    setUserLimits((prev) => ({
      ...prev,
      [testType]: {
        ...prev[testType],
        [field]: value,
      },
    }));
  };

  // Save User Limits via PUT /api/test-limits/users/:userId
  const handleSaveUserLimits = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        overrides: Object.values(userLimits).map((l) => ({
          testType: l.testType,
          overrideType: l.overrideType.toUpperCase(),
          period: l.overrideType === 'custom' ? l.period : undefined,
          limit:
            l.overrideType === 'custom'
              ? Number(l.limit)
              : l.overrideType === 'unlimited'
              ? null
              : l.overrideType === 'blocked'
              ? 0
              : undefined,
          isUnlimited: l.overrideType === 'unlimited',
          isBlocked: l.overrideType === 'blocked',
        })),
      };

      const res = await api.put(`/test-limits/users/${selectedUser.id}`, payload);

      if (res.data?.success || res.status === 200) {
        setMessage({ type: 'success', text: `Test limit overrides saved for ${selectedUser.name}!` });
        // Immediately refetch from backend to refresh status and audit metadata
        await fetchUserLimits(selectedUser.id);
      } else {
        setMessage({ type: 'success', text: 'User test limits updated successfully!' });
      }

      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Failed to save user test limits:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save user limits.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-0.5 rounded-full text-xs font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">User Test Limit Overrides</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Search candidate accounts and configure custom attempt limit overrides, unlimited access, or blocks per user.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loadingUsers}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Main Grid: User Search & Selection (Left) + Limits Configuration (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: User Search & List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Search className="w-4 h-4 text-purple-600" />
            <span>Search & Select User</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                Loading user directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/70 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 truncate">{u.name}</div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: User Overrides Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedUser ? (
            <div className="space-y-6">
              
              {/* Selected User Header Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Managing Limits For</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5 flex items-center space-x-2">
                    <span>{selectedUser.name}</span>
                    <span className="text-xs text-purple-700 font-mono bg-purple-100 px-2 py-0.5 rounded-full">
                      ID: #{selectedUser.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedUser.email}</span>
                    </span>
                    <span className="capitalize font-bold text-slate-700">• Role: {selectedUser.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveUserLimits}
                  disabled={saving || loadingLimits}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save User Limits'}</span>
                </button>
              </div>

              {/* Status Banner */}
              {message.text && (
                <div
                  className={`flex items-center space-x-3 px-5 py-4 rounded-2xl text-xs font-bold border shadow-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Overrides Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {loadingLimits ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="text-xs font-semibold text-slate-500">Loading user override settings...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Test Type</th>
                          <th className="px-6 py-4">Override Setting</th>
                          <th className="px-6 py-4">Configuration Details</th>
                          <th className="px-6 py-4">Effective Quota & Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                        {TEST_TYPES.map((tt) => {
                          const item = userLimits[tt.key] || {
                            testType: tt.key,
                            overrideType: 'default',
                            period: 'daily',
                            limit: 5,
                          };

                          return (
                            <tr key={tt.key} className="hover:bg-slate-50/80 transition-colors">
                              {/* Test Type */}
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{tt.name}</div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Role Default: {item.roleDefaultLimit || '2/period'}</div>
                              </td>

                              {/* Override Type Radio/Select */}
                              <td className="px-6 py-4">
                                <select
                                  value={item.overrideType}
                                  onChange={(e) => handleFieldChange(tt.key, 'overrideType', e.target.value)}
                                  className={`px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer ${
                                    item.overrideType === 'default'
                                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                                      : item.overrideType === 'custom'
                                      ? 'bg-purple-100 border-purple-300 text-purple-900'
                                      : item.overrideType === 'unlimited'
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                      : 'bg-rose-100 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  {OVERRIDE_TYPES.map((ot) => (
                                    <option key={ot.key} value={ot.key}>
                                      {ot.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Custom Config inputs when Override Type is Custom Limit */}
                              <td className="px-6 py-4">
                                {item.overrideType === 'default' ? (
                                  <span className="text-xs text-slate-400 font-semibold italic">
                                    Inherits Role Default ({item.roleDefaultLimit || '2/period'})
                                  </span>
                                ) : item.overrideType === 'unlimited' ? (
                                  <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-xl inline-flex items-center space-x-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Unlimited Attempts</span>
                                  </span>
                                ) : item.overrideType === 'blocked' ? (
                                  <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 font-extrabold text-xs rounded-xl inline-flex items-center space-x-1.5">
                                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Blocked Access</span>
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Period:</label>
                                      <select
                                        value={item.period}
                                        onChange={(e) => handleFieldChange(tt.key, 'period', e.target.value)}
                                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      >
                                        {PERIOD_OPTIONS.map((po) => (
                                          <option key={po.key} value={po.key}>
                                            {po.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Max Attempts:</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={item.limit}
                                        onChange={(e) => handleFieldChange(tt.key, 'limit', e.target.value)}
                                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Effective Limit & Audit */}
                              <td className="px-6 py-4 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[11px] font-bold text-slate-500">Effective:</span>
                                  <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                                    item.effectiveStatus === 'unlimited'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.effectiveStatus === 'blocked'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-purple-100 text-purple-900'
                                  }`}>
                                    {item.effectiveLimit}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Source: {item.source}</span>
                                </div>
                                {item.updatedAt && (
                                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Saved: {new Date(item.updatedAt).toLocaleString()}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No User Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please search and select a candidate account from the left panel to inspect or customize their test attempt limits.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AdminUserTestLimits;
