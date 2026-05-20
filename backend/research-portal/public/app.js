// Token lives in sessionStorage so it dies with the tab.
const TOKEN_KEY = 'kyndill_research_token';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const sessionInfo = document.getElementById('session-info');
const sessionEmail = document.getElementById('session-email');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout');
const tableList = document.getElementById('table-list');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const previewSection = document.getElementById('preview-section');
const previewTitle = document.getElementById('preview-title');
const previewMeta = document.getElementById('preview-meta');
const previewTable = document.getElementById('preview-table');
const downloadCsvBtn = document.getElementById('download-csv');
const closePreviewBtn = document.getElementById('close-preview');

let activeTableKey = null;

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    setToken(null);
    showLogin();
    throw new Error('Session expired.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body && body.error && body.error.message ? body.error.message : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return res;
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
  sessionInfo.hidden = true;
}

async function showDashboard(email) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  sessionInfo.hidden = false;
  sessionEmail.textContent = email;
  await loadTables();
}

async function loadTables() {
  tableList.innerHTML = '';
  try {
    const res = await api('/api/research/tables');
    const data = await res.json();
    data.tables.forEach((t) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = t.label;
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = t.count.toLocaleString();
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = 'Open';
      open.addEventListener('click', () => loadPreview(t.key, t.label));
      li.appendChild(name);
      li.appendChild(count);
      li.appendChild(open);
      tableList.appendChild(li);
    });
    if (data.tables.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No tables.';
      tableList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = err.message;
    tableList.appendChild(li);
  }
}

function buildFilterQuery() {
  const params = new URLSearchParams();
  if (filterFrom.value) params.set('from', filterFrom.value);
  if (filterTo.value) params.set('to', filterTo.value);
  return params;
}

async function loadPreview(key, label) {
  activeTableKey = key;
  previewSection.hidden = false;
  previewTitle.textContent = label;
  previewMeta.hidden = true;
  previewMeta.textContent = '';
  previewTable.innerHTML = '';
  const params = buildFilterQuery();
  params.set('limit', '100');
  try {
    const res = await api(`/api/research/data/${encodeURIComponent(key)}?${params.toString()}`);
    const data = await res.json();
    renderTable(data.columns, data.rows);
  } catch (err) {
    previewMeta.textContent = err.message;
    previewMeta.hidden = false;
  }
  previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderTable(columns, rows) {
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  previewTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((c) => {
      const td = document.createElement('td');
      const value = row[c];
      td.textContent = value === null || value === undefined ? '' : String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  previewTable.appendChild(tbody);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const form = new FormData(event.target);
  try {
    const res = await fetch('/api/research/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body && body.error ? body.error.message : `HTTP ${res.status}`);
    }
    const data = await res.json();
    setToken(data.token);
    await showDashboard(data.admin.email);
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener('click', () => {
  setToken(null);
  showLogin();
});

closePreviewBtn.addEventListener('click', () => {
  previewSection.hidden = true;
  activeTableKey = null;
});

downloadCsvBtn.addEventListener('click', async () => {
  if (!activeTableKey) return;
  const params = buildFilterQuery();
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }
  // We can't put the token in a download URL safely, so trigger an
  // authenticated fetch and stream the blob.
  try {
    const res = await fetch(`/api/research/export/${encodeURIComponent(activeTableKey)}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(cd);
    const filename = match ? match[1] : `${activeTableKey}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    previewMeta.textContent = err.message;
    previewMeta.hidden = false;
  }
});

(async function init() {
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }
  try {
    const res = await api('/api/research/me');
    const data = await res.json();
    await showDashboard(data.email);
  } catch {
    showLogin();
  }
})();
