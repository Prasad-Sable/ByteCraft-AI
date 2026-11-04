import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const onboardUser = (data) => API.post('/auth/onboarding', data);
export const getMe = () => API.get('/auth/me');

// Lessons
export const getLessons = (params) => API.get('/lessons', { params });

// Recommendations
export const getRecommendations = (data) => API.post('/recommend', data);

// Quiz
export const submitQuiz = (data) => API.post('/submit-quiz', data);

// Dashboard
export const getDashboard = () => API.get('/dashboard');
export const getDashboardAll = () => API.get('/dashboard/all');

// Gamification
export const getBadges = () => API.get('/gamification/badges');
export const getQuests = () => API.get('/gamification/quests');

// Progress
export const recordProgress = (data) => API.post('/progress', data);

// Continue
export const getContinue = () => API.get('/continue');

export default API;

