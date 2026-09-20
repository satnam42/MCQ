import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions([]);
      return;
    }
    setPermissionsLoading(true);
    try {
      const res = await api.get('/permissions/my');
      if (res.data.success && res.data.data?.permissions) {
        setPermissions(res.data.data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions, user]);

  const hasPermission = useCallback((key) => {
    if (!key) return true;
    return permissions.includes(key);
  }, [permissions]);

  return (
    <PermissionContext.Provider value={{ permissions, permissionsLoading, hasPermission, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
