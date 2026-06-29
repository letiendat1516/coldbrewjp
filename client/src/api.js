const API = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi kết nối');
  return data;
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (fullName, email, password, role) => request('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, role }) }),
  me: () => request('/auth/me'),
};

export const classes = {
  list: () => request('/classes'),
  get: (id) => request('/classes/' + id),
  create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  join: (joinCode) => request('/classes/join', { method: 'POST', body: JSON.stringify({ joinCode }) }),
};

export const rewards = {
  give: (classId, studentId, stickerId) => request('/rewards', { method: 'POST', body: JSON.stringify({ classId, studentId, stickerId }) }),
  classLogs: (classId, params = '') => request(`/rewards/class/${classId}?${params}`),
};

export const ranking = {
  get: (classId) => request('/ranking/class/' + classId),
  summary: (classId) => request('/ranking/class/' + classId + '/summary'),
};
