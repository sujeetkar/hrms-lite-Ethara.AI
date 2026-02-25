const BASE = process.env.REACT_APP_API_URL || 'https://hrms-lite-ethara-ai-0dr2.onrender.com';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

export const api = {
  // Employees
  getEmployees: () => request('/api/employees'),
  createEmployee: (body) => request('/api/employees', { method: 'POST', body: JSON.stringify(body) }),
  deleteEmployee: (id) => request(`/api/employees/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (employeeId, dateFilter) => {
    const params = new URLSearchParams();
    if (employeeId) params.set('employee_id', employeeId);
    if (dateFilter) params.set('date_filter', dateFilter);
    return request(`/api/attendance?${params}`);
  },
  markAttendance: (body) => request('/api/attendance', { method: 'POST', body: JSON.stringify(body) }),

  // Dashboard
  getDashboard: () => request('/api/dashboard'),
};