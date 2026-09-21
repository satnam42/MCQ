import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { usePermissions } from '../../context/PermissionContext';
import {
  Lock,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  Users,
  Settings,
  Loader2,
} from 'lucide-react';

const ManagePermissionsPage = () => {
  const { refreshPermissions } = usePermissions();
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissions/all');
      if (res.data.success) {
        const { permissions: perms, roles: roleList } = res.data.data;
        setPermissions(perms);
        setRoles(roleList);

        // Build initial state: { admin: ['HOME_VIEW', ...], candidate: ['HOME_VIEW', ...] }
        const rpMap = {};
        roleList.forEach(r => {
          rpMap[r.name] = perms
            .filter(p => p.assignedRoles.includes(r.name))
            .map(p => p.key);
        });
        setRolePermissions(rpMap);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setMessage({ type: 'error', text: 'Failed to load permissions data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePermission = (roleName, permKey) => {
    // Prevent disabling MANAGE_PERMISSIONS for admin
    if (roleName === 'admin' && permKey === 'MANAGE_PERMISSIONS') return;

    setRolePermissions(prev => {
      const current = prev[roleName] || [];
      const updated = current.includes(permKey)
        ? current.filter(k => k !== permKey)
        : [...current, permKey];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const savePromises = roles.map(role =>
        api.put(`/permissions/role/${role.name}`, {
          permissions: rolePermissions[role.name] || [],
        })
      );
      await Promise.all(savePromises);
      setMessage({ type: 'success', text: 'Permissions saved successfully!' });
      await refreshPermissions();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      setMessage({ type: 'error', text: 'Failed to save permissions. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const navigationPerms = permissions.filter(p => p.group === 'navigation');
  const adminPerms = permissions.filter(p => p.group === 'admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading permissions...</span>
        </div>
      </div>
    );
  }

  const renderPermissionRow = (perm) => (
    <tr key={perm.key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-bold text-sm text-slate-800">{perm.label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{perm.key}</div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          perm.group === 'admin'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {perm.group}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs text-slate-500">{perm.description}</span>
      </td>
      {roles.map(role => {
        const isEnabled = (rolePermissions[role.name] || []).includes(perm.key);
        const isLocked = role.name === 'admin' && perm.key === 'MANAGE_PERMISSIONS';

        return (
          <td key={role.name} className="px-4 py-3 text-center">
            <button
              onClick={() => togglePermission(role.name, perm.key)}
              disabled={isLocked}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isLocked
                  ? 'bg-purple-400 cursor-not-allowed opacity-70 focus:ring-purple-300'
                  : isEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer focus:ring-emerald-400'
                    : 'bg-slate-300 hover:bg-slate-400 cursor-pointer focus:ring-slate-300'
              }`}
              title={isLocked ? 'Cannot disable: prevents admin lockout' : `${isEnabled ? 'Disable' : 'Enable'} ${perm.label} for ${role.name}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </td>
        );
      })}
    </tr>
  );

  const renderSectionHeader = (title, icon, colorClass) => (
    <tr className="bg-slate-50">
      <td colSpan={3 + roles.length} className="px-4 py-2.5">
        <div className={`flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider ${colorClass}`}>
          {icon}
          <span>{title}</span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Permission Management</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Control which menu items and features are accessible to each role.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reload permissions"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Permission</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">Group</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">Description</th>
                {roles.map(role => (
                  <th key={role.name} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    <div className="flex flex-col items-center space-y-1">
                      {role.name === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Users className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="capitalize">{role.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderSectionHeader('Navigation Permissions', <Settings className="w-3.5 h-3.5" />, 'text-amber-600')}
              {navigationPerms.map(perm => renderPermissionRow(perm))}
              {renderSectionHeader('Admin Permissions', <Shield className="w-3.5 h-3.5" />, 'text-purple-600')}
              {adminPerms.map(perm => renderPermissionRow(perm))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="text-sm font-bold text-purple-900">Security Notes</div>
            <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
              <li>Admin's <strong>Manage Permissions</strong> cannot be disabled to prevent lockout.</li>
              <li>Hiding a menu item is <strong>NOT</strong> full security — API-level permission checks are also enforced on the backend.</li>
              <li>Changes take effect immediately after saving. Users may need to refresh their browser.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePermissionsPage;
