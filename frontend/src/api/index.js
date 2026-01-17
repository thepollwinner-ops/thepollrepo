import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (name, email, password) => api.post('/auth/register', { name, email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Polls APIs
export const getPolls = () => api.get('/polls');
export const getPoll = (pollId) => api.get(`/polls/${pollId}`);
export const getPollResults = (pollId) => api.get(`/polls/${pollId}/results`);
export const getMyResult = (pollId) => api.get(`/polls/${pollId}/my-result`);
export const purchaseVotes = (pollId, data) => api.post(`/polls/${pollId}/purchase`, data);
export const castVote = (pollId, data) => api.post(`/polls/${pollId}/vote`, data);
export const getPollHistory = () => api.get('/polls/history');

// Wallet APIs
export const getWallet = () => api.get('/wallet');
export const getTransactions = () => api.get('/transactions');
export const requestWithdrawal = (amount, upiId) => api.post('/withdrawals', { amount, upi_id: upiId });

// User APIs
export const updateUPI = (upiId) => api.put('/user/upi', { upi_id: upiId });

export default api;
