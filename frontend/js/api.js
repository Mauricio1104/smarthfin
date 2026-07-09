const LOGIN_URL = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
const DASHBOARD_URL = window.location.pathname.includes('/pages/') ? 'dashboard.html' : 'pages/dashboard.html';

function getToken() {
  return localStorage.getItem('smarthfin_token');
}

function setSession(token, user) {
  localStorage.setItem('smarthfin_token', token);
  localStorage.setItem('smarthfin_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('smarthfin_token');
  localStorage.removeItem('smarthfin_user');
}

function getCurrentUser() {
  const raw = localStorage.getItem('smarthfin_user');
  return raw ? JSON.parse(raw) : null;
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = LOGIN_URL;
  }
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(isoDate) {
  const [year, month, day] = String(isoDate).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = LOGIN_URL;
    return null;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Erro inesperado ao comunicar com a API.');
  }

  return data;
}
