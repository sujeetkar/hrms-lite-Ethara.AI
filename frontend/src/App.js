import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import './App.css';

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    employees: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    attendance: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20,6 9,17 4,12"/>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/></>,
    filter: <><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></>,
    chevronRight: <polyline points="9,18 15,12 9,6"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <Icon name={type === 'error' ? 'alert' : 'check'} size={16} />
      <span>{message}</span>
      <button onClick={onClose} className="toast__close"><Icon name="x" size={14} /></button>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button onClick={onClose} className="modal__close"><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><span>Loading dashboard...</span></div>;
  if (error) return <div className="page-error"><Icon name="alert" size={24} /><span>{error}</span></div>;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Dashboard</h1>
          <p className="page__subtitle">Overview of your organization</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon"><Icon name="users" size={22} /></div>
          <div className="stat-card__body">
            <div className="stat-card__label">Total Employees</div>
            <div className="stat-card__value">{stats.total_employees}</div>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__icon"><Icon name="check" size={22} /></div>
          <div className="stat-card__body">
            <div className="stat-card__label">Present Today</div>
            <div className="stat-card__value">{stats.present_today}</div>
          </div>
        </div>
        <div className="stat-card stat-card--red">
          <div className="stat-card__icon"><Icon name="x" size={22} /></div>
          <div className="stat-card__body">
            <div className="stat-card__label">Absent Today</div>
            <div className="stat-card__value">{stats.absent_today}</div>
          </div>
        </div>
        <div className="stat-card stat-card--amber">
          <div className="stat-card__icon"><Icon name="building" size={22} /></div>
          <div className="stat-card__body">
            <div className="stat-card__label">Departments</div>
            <div className="stat-card__value">{stats.departments.length}</div>
          </div>
        </div>
      </div>

      {stats.departments.length > 0 && (
        <div className="card">
          <div className="card__header"><h3 className="card__title">Employees by Department</h3></div>
          <div className="dept-list">
            {stats.departments.map(d => (
              <div key={d.name} className="dept-row">
                <span className="dept-row__name">{d.name}</span>
                <div className="dept-row__bar-wrap">
                  <div className="dept-row__bar" style={{ width: `${(d.count / stats.total_employees) * 100}%` }} />
                </div>
                <span className="dept-row__count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.total_employees === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><Icon name="users" size={32} /></div>
          <h3 className="empty-state__title">No data yet</h3>
          <p className="empty-state__desc">Add employees to see dashboard insights</p>
          <button className="btn btn--primary" onClick={() => onNavigate('employees')}>
            <Icon name="plus" size={16} /> Add Employee
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Employees ─────────────────────────────────────────────────────────────────
function Employees({ onToast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ employee_id: '', full_name: '', email: '', department: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getEmployees()
      .then(setEmployees)
      .catch(() => setError('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.createEmployee(form);
      onToast('Employee added successfully', 'success');
      setShowModal(false);
      setForm({ employee_id: '', full_name: '', email: '', department: '' });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.deleteEmployee(id);
      onToast('Employee deleted', 'success');
      load();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Product'];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Employees</h1>
          <p className="page__subtitle">{employees.length} team member{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={16} /> Add Employee
        </button>
      </div>

      {loading && <div className="page-loading"><div className="spinner" /><span>Loading employees...</span></div>}
      {error && <div className="page-error"><Icon name="alert" size={20} /><span>{error}</span></div>}

      {!loading && !error && employees.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><Icon name="users" size={32} /></div>
          <h3 className="empty-state__title">No employees yet</h3>
          <p className="empty-state__desc">Add your first employee to get started</p>
          <button className="btn btn--primary" onClick={() => setShowModal(true)}>
            <Icon name="plus" size={16} /> Add Employee
          </button>
        </div>
      )}

      {!loading && employees.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.employee_id}>
                  <td><span className="badge">{emp.employee_id}</span></td>
                  <td className="td--name">
                    <div className="avatar">{emp.full_name.slice(0, 2).toUpperCase()}</div>
                    {emp.full_name}
                  </td>
                  <td className="td--muted">{emp.email}</td>
                  <td><span className="dept-chip">{emp.department}</span></td>
                  <td className="td--muted">{new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button
                      className="btn-icon btn-icon--danger"
                      onClick={() => { if (window.confirm(`Delete ${emp.full_name}?`)) handleDelete(emp.employee_id); }}
                      disabled={deleting === emp.employee_id}
                    >
                      {deleting === emp.employee_id ? <div className="spinner spinner--sm" /> : <Icon name="trash" size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Add New Employee" onClose={() => { setShowModal(false); setFormError(''); setForm({ employee_id: '', full_name: '', email: '', department: '' }); }}>
          <form onSubmit={handleSubmit} className="modal__form">
            {formError && <div className="form-error"><Icon name="alert" size={15} />{formError}</div>}
            <div className="form-row">
              <label>Employee ID *</label>
              <input className="input" placeholder="e.g. EMP001" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required />
            </div>
            <div className="form-row">
              <label>Full Name *</label>
              <input className="input" placeholder="John Doe" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="form-row">
              <label>Email Address *</label>
              <input className="input" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-row">
              <label>Department *</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => { setShowModal(false); setFormError(''); }}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? <><div className="spinner spinner--sm" /> Saving...</> : 'Add Employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Attendance ─────────────────────────────────────────────────────────────────
function AttendancePage({ onToast }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employee_id: '', date: new Date().toISOString().slice(0, 10), status: 'Present' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getEmployees(), api.getAttendance(filterEmp || undefined, filterDate || undefined)])
      .then(([emps, att]) => { setEmployees(emps); setAttendance(att); })
      .finally(() => setLoading(false));
  }, [filterEmp, filterDate]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.markAttendance(form);
      onToast('Attendance marked', 'success');
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const empMap = Object.fromEntries(employees.map(e => [e.employee_id, e]));

  // Stats per employee
  const presentCounts = {};
  attendance.forEach(a => {
    if (a.status === 'Present') presentCounts[a.employee_id] = (presentCounts[a.employee_id] || 0) + 1;
  });

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Attendance</h1>
          <p className="page__subtitle">{attendance.length} record{attendance.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)} disabled={employees.length === 0}>
          <Icon name="plus" size={16} /> Mark Attendance
        </button>
      </div>

      <div className="filters">
        <div className="filter-item">
          <Icon name="filter" size={14} />
          <select className="input input--sm" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <Icon name="attendance" size={14} />
          <input className="input input--sm" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
        {(filterEmp || filterDate) && (
          <button className="btn btn--ghost btn--sm" onClick={() => { setFilterEmp(''); setFilterDate(''); }}>
            <Icon name="x" size={14} /> Clear
          </button>
        )}
      </div>

      {employees.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state__icon"><Icon name="users" size={32} /></div>
          <h3 className="empty-state__title">No employees</h3>
          <p className="empty-state__desc">Add employees before marking attendance</p>
        </div>
      )}

      {loading && <div className="page-loading"><div className="spinner" /><span>Loading attendance...</span></div>}

      {!loading && attendance.length === 0 && employees.length > 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><Icon name="attendance" size={32} /></div>
          <h3 className="empty-state__title">No records found</h3>
          <p className="empty-state__desc">{filterEmp || filterDate ? 'No records match your filters' : 'Start tracking attendance for your team'}</p>
        </div>
      )}

      {!loading && attendance.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total Present Days</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => {
                const emp = empMap[a.employee_id];
                return (
                  <tr key={a.id}>
                    <td className="td--name">
                      <div className="avatar">{emp ? emp.full_name.slice(0, 2).toUpperCase() : '??'}</div>
                      <div>
                        <div>{emp ? emp.full_name : a.employee_id}</div>
                        <div className="td--subtext">{a.employee_id}</div>
                      </div>
                    </td>
                    <td><span className="dept-chip">{emp ? emp.department : '—'}</span></td>
                    <td className="td--muted">{new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`status-badge status-badge--${a.status === 'Present' ? 'present' : 'absent'}`}>
                        {a.status === 'Present' ? <Icon name="check" size={12} /> : <Icon name="x" size={12} />}
                        {a.status}
                      </span>
                    </td>
                    <td className="td--muted">{presentCounts[a.employee_id] || 0} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Mark Attendance" onClose={() => { setShowModal(false); setFormError(''); }}>
          <form onSubmit={handleSubmit} className="modal__form">
            {formError && <div className="form-error"><Icon name="alert" size={15} />{formError}</div>}
            <div className="form-row">
              <label>Employee *</label>
              <select className="input" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name} ({e.employee_id})</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="form-row">
              <label>Status *</label>
              <div className="radio-group">
                {['Present', 'Absent'].map(s => (
                  <label key={s} className={`radio-option ${form.status === s ? 'radio-option--active' : ''}`}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} />
                    <span className={`radio-dot radio-dot--${s.toLowerCase()}`} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => { setShowModal(false); setFormError(''); }}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? <><div className="spinner spinner--sm" /> Saving...</> : 'Save Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'employees', label: 'Employees', icon: 'employees' },
    { id: 'attendance', label: 'Attendance', icon: 'attendance' },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <div className="sidebar__logo-mark">HR</div>
          <div>
            <div className="sidebar__logo-name">HRMS Lite</div>
            <div className="sidebar__logo-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar__nav-item ${page === item.id ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {page === item.id && <div className="sidebar__nav-active-bar" />}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__footer-text">HRMS Lite v1.0</div>
        </div>
      </aside>

      <main className="main">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'employees' && <Employees onToast={addToast} />}
        {page === 'attendance' && <AttendancePage onToast={addToast} />}
      </main>

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}