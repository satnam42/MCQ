import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Sliders, Save, RefreshCw, CheckCircle, AlertCircle, Shield, Users, Lock, Sparkles, Ban } from 'lucide-react';

const TEST_TYPES = [
  { key: 'daily', name: 'Daily Test', defaultPeriod: 'daily', defaultLimit: 2 },
  { key: 'practice', name: 'Practice Test', defaultPeriod: 'daily', defaultLimit: 5 },
  { key: 'topic', name: 'Topic Test', defaultPeriod: 'weekly', defaultLimit: 10 },
  { key: 'mock', name: 'Full Mock Test', defaultPeriod: 'monthly', defaultLimit: 3 },
];

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily (Resets Midnight)' },
  { key: 'weekly', label: 'Weekly (Resets Monday)' },
  { key: 'monthly', label: 'Monthly (Resets 1st of Month)' },
  { key: 'lifetime', label: 'Lifetime (No Reset)' },
];

const AdminTestLimits = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Fetch available roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      let roleList = [];
      try {
        const res = await api.get('/test-limits/roles');
        if (res.data?.success && Array.isArray(res.data.data)) {
          roleList = res.data.data;
        }
      } catch {
        // Fallback to /permissions/all if /test-limits/roles is not available
        const permRes = await api.get('/permissions/all');
        if (permRes.data?.success && permRes.data.data?.roles) {
          roleList = permRes.data.data.roles;
        }
      }

      if (roleList.length === 0) {
        roleList = [
          { id: 'candidate', name: 'candidate' },
          { id: 'admin', name: 'admin' },
        ];
      }

      setRoles(roleList);
      if (roleList.length > 0) {
        const initialRoleId = roleList[0].id || roleList[0].name;
        setSelectedRole(String(initialRoleId));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setMessage({ type: 'error', text: 'Failed to load roles list.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // 2. Fetch role limits when selectedRole changes
  const fetchLimitsForRole = useCallback(async (roleId) => {
    if (!roleId) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get(`/test-limits/roles/${roleId}`);
      if (res.data?.success && res.data.data) {
        const fetchedLimits = res.data.data.limits || res.data.data;
        // Merge with defaults
        const updated = {};
        TEST_TYPES.forEach((tt) => {
          const item = Array.isArray(fetchedLimits)
            ? fetchedLimits.find((l) => l.testType === tt.key)
            : fetchedLimits[tt.key];

          updated[tt.key] = {
            testType: tt.key,
            name: tt.name,
            period: item?.period || tt.defaultPeriod,
            limit: item?.limit ?? item?.maxAttempts ?? tt.defaultLimit,
            isUnlimited: item?.isUnlimited ?? item?.limit === null ?? false,
            isDisabled: item?.isDisabled ?? item?.isBlocked ?? false,
          };
        });
        setLimits(updated);
      } else {
        // Default initial limits
        const defaultState = {};
        TEST_TYPES.forEach((tt) => {
          defaultState[tt.key] = {
            testType: tt.key,
            name: tt.name,
            period: tt.defaultPeriod,
            limit: tt.defaultLimit,
            isUnlimited: false,
            isDisabled: false,
          };
        });
        setLimits(defaultState);
      }
    } catch (err) {
      console.warn('Could not load specific role limits, using defaults:', err);
      const defaultState = {};
      TEST_TYPES.forEach((tt) => {
        defaultState[tt.key] = {
          testType: tt.key,
          name: tt.name,
          period: tt.defaultPeriod,
          limit: tt.defaultLimit,
          isUnlimited: false,
          isDisabled: false,
        };
      });
      setLimits(defaultState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchLimitsForRole(selectedRole);
    }
  }, [selectedRole, fetchLimitsForRole]);

  // Handle input modifications
  const handleLimitChange = (testType, field, value) => {
    setLimits((prev) => {
      const current = prev[testType] || { testType, period: 'daily', limit: 1, isUnlimited: false, isDisabled: false };
      const updated = { ...current, [field]: value };

      if (field === 'isUnlimited' && value) {
        updated.isDisabled = false;
      }
      if (field === 'isDisabled' && value) {
        updated.isUnlimited = false;
      }

      return {
        ...prev,
        [testType]: updated,
      };
    });
  };

  // Save role limits via PUT /api/test-limits/roles/:roleId
  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        limits: Object.values(limits).map((l) => ({
          testType: l.testType,
          period: l.period,
          limit: l.isDisabled ? 0 : l.isUnlimited ? null : Number(l.limit),
          isUnlimited: l.isUnlimited,
          isDisabled: l.isDisabled,
        })),
      };

      const res = await api.put(`/test-limits/roles/${selectedRole}`, payload);

      if (res.data?.success || res.status === 200) {
        setMessage({ type: 'success', text: `Test limits successfully saved for selected role!` });
      } else {
        setMessage({ type: 'success', text: `Test limits updated successfully!` });
      }

      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Failed to save role test limits:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save test limits. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleObj = roles.find((r) => String(r.id || r.name) === selectedRole);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-xs font-bold mb-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Role Test Limit Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Configure maximum test attempt quotas and reset periods for user roles.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={() => fetchLimitsForRole(selectedRole)}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
            title="Reload limits"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Limits'}</span>
          </button>
        </div>
      </div>

      {/* Role Selection Dropdown */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-slate-500" />
          <div>
            <label className="text-xs font-bold text-slate-700 block">Target Role Selector:</label>
            <span className="text-xs text-slate-500">Select the role whose default test quotas you want to manage</span>
          </div>
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer min-w-[220px]"
        >
          {roles.map((r) => {
            const roleId = r.id || r.name;
            const roleName = r.name || r.id;
            return (
              <option key={roleId} value={roleId}>
                {roleName.charAt(0).toUpperCase() + roleName.slice(1)} Role
              </option>
            );
          })}
        </select>
      </div>

      {/* Status Feedback Message */}
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

      {/* Test Limits Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <span className="text-xs font-semibold text-slate-500">Loading role limits...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Test Type</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4">Reset Period</th>
                  <th className="px-6 py-4">Max Attempts Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                {TEST_TYPES.map((tt) => {
                  const item = limits[tt.key] || {
                    testType: tt.key,
                    period: tt.defaultPeriod,
                    limit: tt.defaultLimit,
                    isUnlimited: false,
                    isDisabled: false,
                  };

                  return (
                    <tr key={tt.key} className="hover:bg-slate-50/80 transition-colors">
                      {/* Test Type Name */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{tt.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">type: {tt.key}</div>
                      </td>

                      {/* Access Status Checkboxes */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Unlimited Checkbox */}
                          <label className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            item.isUnlimited
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={item.isUnlimited}
                              onChange={(e) => handleLimitChange(tt.key, 'isUnlimited', e.target.checked)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unlimited</span>
                          </label>

                          {/* Disabled Checkbox */}
                          <label className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            item.isDisabled
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={item.isDisabled}
                              onChange={(e) => handleLimitChange(tt.key, 'isDisabled', e.target.checked)}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>Disabled</span>
                          </label>
                        </div>
                      </td>

                      {/* Configurable Reset Period */}
                      <td className="px-6 py-4">
                        <select
                          value={item.period}
                          onChange={(e) => handleLimitChange(tt.key, 'period', e.target.value)}
                          disabled={item.isDisabled}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                        >
                          {PERIOD_OPTIONS.map((po) => (
                            <option key={po.key} value={po.key}>
                              {po.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Limit Input */}
                      <td className="px-6 py-4">
                        {item.isUnlimited ? (
                          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-xl inline-block">
                            Unlimited Attempts
                          </span>
                        ) : item.isDisabled ? (
                          <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl inline-block">
                            Test Disabled (0)
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2 max-w-[140px]">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={item.limit}
                              onChange={(e) => handleLimitChange(tt.key, 'limit', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              placeholder="Attempts"
                            />
                            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">attempts</span>
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

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start space-x-3 text-amber-900 text-xs font-medium">
        <Sliders className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-950">How Role Test Limits Work</div>
          <p className="leading-relaxed">
            Role test limits apply automatically to all users belonging to that role unless a specific <strong>User Override Limit</strong> is configured.
            When limits are updated, candidate quotas will evaluate against these newly defined attempt thresholds on their next test attempt.
          </p>
        </div>
      </div>

    </div>
  );
};

export default AdminTestLimits;
