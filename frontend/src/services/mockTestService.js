import api from './api';

export const getMockConfig = async () => {
  const response = await api.get('/mock-tests/config');
  return response.data;
};

export const generateMockTest = async (payload) => {
  const response = await api.post('/mock-tests/generate', payload);
  return response.data;
};

export const getAdminSettings = async () => {
  const response = await api.get('/admin/mock-tests/settings');
  return response.data;
};

export const updateAdminSettings = async (settings) => {
  const response = await api.put('/admin/mock-tests/settings', settings);
  return response.data;
};

export const updateUserPermission = async (userId, payload) => {
  const response = await api.put(`/admin/mock-tests/users/${userId}/mock-test-permission`, payload);
  return response.data;
};

export const updateUserLimit = async (userId, payload) => {
  const response = await api.put(`/admin/mock-tests/users/${userId}/mock-test-limit`, payload);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/admin/mock-tests/dashboard-stats');
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/admin/mock-tests/audit-logs');
  return response.data;
};

const mockTestService = {
  getMockConfig,
  generateMockTest,
  getAdminSettings,
  updateAdminSettings,
  updateUserPermission,
  updateUserLimit,
  getDashboardStats,
  getAuditLogs,
};

export default mockTestService;
