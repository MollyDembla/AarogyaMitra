import api from './api';

export const generateRecoveryPlan = async (journeyId = null, exceptionalConditions = '') => {
  const res = await api.post('/agents/recovery-wellness/plan', { journeyId, exceptionalConditions });
  return res.data || res;
};

export const getLatestProfile = async () => {
  const res = await api.get('/recovery/profile/latest');
  return res.data || res;
};

export const submitFeedback = async (payload) => {
  const res = await api.post('/recovery/feedback', payload);
  return res.data || res;
};

export const getHistory = async () => {
  const res = await api.get('/recovery/history');
  return res.data || res;
};
