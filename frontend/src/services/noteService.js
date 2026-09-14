import api from './api';

export const getTopics = async () => {
  const response = await api.get('/topics');
  return response.data;
};

export const createTopic = async (topicData) => {
  const response = await api.post('/topics', topicData);
  return response.data;
};

export const getNotes = async (topicId = null, status = null) => {
  const params = {};
  if (topicId) params.topicId = topicId;
  if (status) params.status = status;

  const response = await api.get('/notes', { params });
  return response.data;
};

export const getNoteById = async (id) => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

export const previewNote = async (formData) => {
  const response = await api.post('/notes/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createNote = async (formData) => {
  const response = await api.post('/notes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateNote = async (id, formData) => {
  const response = await api.put(`/notes/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};

const noteService = {
  getTopics,
  createTopic,
  getNotes,
  getNoteById,
  previewNote,
  createNote,
  updateNote,
  deleteNote,
};

export default noteService;
