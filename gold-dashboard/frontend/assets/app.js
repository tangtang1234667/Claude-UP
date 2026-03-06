/**
 * Gold Investment Dashboard — Frontend Application
 */

const API = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:8000'
  : window.location.origin;

// ── State ──────────────────────────────────────────────────────────────────
let priceChart = null;
let currentChartDays = 30;
let latestSnapshot = null;

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initForms();
  initButtons();
  checkStatus();
  loadDashboard();
  setTodayDefaults();
  // Auto-refresh price every 5 minutes
  setInterval(loadLatestPrice, 5 * 60 * 1000);
});

function setTodayDefaults() {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(el => {
    if (!el.value) el.value = today;
  });
}

// ── Navigation ─────────────────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
  document.getElementById(`page-${page}`).classList.add('active');

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'brief':     loadBrief(); break;
    case 'positions': loadPositions(); break;
    case 'plans':     loadPlans(); break;
    case 'alerts':    loadAlerts(); break;
    case 'calendar':  loadCalendar(); break;
    case 'reviews':   loadReviews(); break;
  }
}

// ── Status Check ───────────────────────────────────────────────────────────
async function checkStatus() {
  try {
    const data = await apiFetch('/api/status');
    const dot = document.getElementById('status-indicator');
    const txt = document.getElementById('status-text');
    dot.className = 'status-dot online';
    txt.textContent = data.api_key_configured ? 'AI已配置' : '数据已连接';
  } catch {
    document.getElementById('status-indicator').className = 'status-dot offline';
    document.getElementById('status-text').textContent = '离线';
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────
async function loadDashboard() {
  await Promise.all([
    loadLatestPrice(),
    loadPriceChart(currentChartDays),
    loadTodayBriefSummary(),
  ]);
}

async function loadLatestPrice() {
  const res = await apiFetch('/api/prices/latest');
  if (!res.data) return;
  const d = res.data;
  latestSnapshot = d;

  document.getElementById('price-domestic').textContent = fmt(d.domestic_cny_g);
  document.getElementById('price-intl-usd').textContent = fmt(d.intl_usd_oz);
  document.getElementById('price-intl-cny').textContent = `${fmt(d.intl_cny_g)} CNY/g`;
  document.getElementById('price-spread').textContent   = fmt(d.spread_cny_g);
  document.getElementById('price-usdcny').textContent   = fmt(d.usd_cny_rate, 4);
  document.getElementById('dxy-val').textContent        = `DXY: ${fmt(d.dxy, 2)}`;
  document.getElementById('m-dxy').textContent          = fmt(d.dxy, 2);
  document.getElementById('m-us10y').textContent        = d.us10y_yield ? `${fmt(d.us10y_yield, 3)}%` : '--';
  document.getElementById('m-spx').textContent          = fmt(d.spx, 0);

  // Bank cards
  setBank('icbc', d.icbc_buy);
  setBank('ccb',  d.ccb_buy);
  setBank('boc',  d.boc_buy);
  setBank('abc',  d.abc_buy);
  setBank('cmb',  d.cmb_buy);

  // Timestamp
  if (d.ts) {
    const ts = new Date(d.ts + 'Z');
    document.getElementById('last-update-ts').textContent = `更新于 ${ts.toLocaleString('zh-CN')}`;
  }
}

function setBank(id, price) {
  const el = document.querySelector(`#bank-${id} .bank-price`);
  if (el) el.textContent = price ? `${fmt(price)}` : '--';
}

async function loadPriceChart(days) {
  const res = await apiFetch(`/api/prices/history?days=${days}`);
  const rows = res.data || [];
  if (!rows.length) return;

  const labels  = rows.map(r => r.ts.substring(0, 16).replace('T', ' '));
  const domestic = rows.map(r => r.domestic_cny_g);
  const intl     = rows.map(r => r.intl_cny_g);

  const ctx = document.getElementById('chart-price').getContext('2d');
  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '国内金价 (CNY/g)',
          data: domestic,
          borderColor: '#D4A843',
          backgroundColor: 'rgba(212,168,67,0.08)',
          borderWidth: 2,
          pointRadius: rows.length > 60 ? 0 : 3,
          tension: 0.3,
          fill: true,
        },
        {
          label: '国际折算 (CNY/g)',
          data: intl,
          borderColor: '#4A90E2',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#9A9280', font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#1E222C',
          borderColor: '#D4A843',
          borderWidth: 1,
          titleColor: '#E8E0D0',
          bodyColor: '#9A9280',
        },
      },
      scales: {
        x: {
          ticks: { color: '#6A6560', maxRotation: 0, autoSkipPadding: 20 },
          grid:  { color: 'rgba(255,255,255,0.03)' },
        },
        y: {
          ticks: { color: '#9A9280' },
          grid:  { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });
}

// Chart tab buttons
document.addEventListener('click', e => {
  if (e.target.classList.contains('btn-tab')) {
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentChartDays = parseInt(e.target.dataset.days);
    loadPriceChart(currentChartDays);
  }
});

async function loadTodayBriefSummary() {
  const res = await apiFetch('/api/brief/today');
  if (!res.data) return;
  const d = res.data;

  const badge = document.getElementById('rec-badge');
  badge.textContent = recLabel(d.recommendation);
  badge.className = `rec-badge ${d.recommendation}`;

  document.getElementById('rec-reason-short').textContent =
    (d.rec_reason || '').slice(0, 120) + '...';
}

// ── AI Brief ───────────────────────────────────────────────────────────────
async function loadBrief() {
  const res = await apiFetch('/api/brief/today');
  const empty   = document.getElementById('brief-empty');
  const content = document.getElementById('brief-content');

  if (!res.data) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  content.classList.remove('hidden');
  renderBrief(res.data);

  // Load history
  const hRes = await apiFetch('/api/brief/history');
  renderBriefHistory(hRes.data || []);
}

function renderBrief(d) {
  document.getElementById('brief-market-summary').textContent = d.market_summary || '--';

  const recBadge = document.getElementById('brief-rec');
  recBadge.textContent = recLabel(d.recommendation);
  recBadge.className = `rec-badge large ${d.recommendation}`;

  if (d.price_range_low && d.price_range_high) {
    document.getElementById('brief-price-range').textContent =
      `${fmt(d.price_range_low)} ~ ${fmt(d.price_range_high)} CNY/g`;
  }

  // Risks
  const risks = Array.isArray(d.key_risks) ? d.key_risks : [];
  document.getElementById('brief-risks').innerHTML = risks
    .map(r => `<span class="risk-tag">${r}</span>`)
    .join('');

  // Metadata
  document.getElementById('brief-date').textContent = `日期: ${d.date || ''}`;
  document.getElementById('brief-model').textContent = `模型: ${d.model_used || 'N/A'}`;

  // Markdown
  const md = d.full_brief || '';
  document.getElementById('brief-markdown').innerHTML = marked.parse(md);
}

function renderBriefHistory(rows) {
  const tbody = document.getElementById('brief-history-body');
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.date}</td>
      <td><span class="rec-badge ${r.recommendation}">${recLabel(r.recommendation)}</span></td>
      <td>${(r.market_summary || '').slice(0, 60)}...</td>
      <td>${r.price_range_low ? `${fmt(r.price_range_low)} ~ ${fmt(r.price_range_high)}` : '--'}</td>
    </tr>
  `).join('');
}

async function generateBrief() {
  const loading = document.getElementById('brief-loading');
  const empty   = document.getElementById('brief-empty');
  const content = document.getElementById('brief-content');
  empty.classList.add('hidden');
  content.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    await apiFetch('/api/brief/generate', { method: 'POST' });
    showToast('AI 简报生成中，约需20-30秒，请稍后刷新...', 'success');
    setTimeout(() => loadBrief(), 30000);
  } catch (e) {
    showToast(`生成失败: ${e.message}`, 'error');
    loading.classList.add('hidden');
    empty.classList.remove('hidden');
  }
}

// ── Positions ──────────────────────────────────────────────────────────────
async function loadPositions() {
  const res = await apiFetch('/api/positions');
  const { data = [], summary = {} } = res;

  // Summary cards
  document.getElementById('summary-grams').textContent    = fmt(summary.total_grams, 4);
  document.getElementById('summary-cost').textContent     = fmtCny(summary.total_cost_cny);
  document.getElementById('summary-avg-cost').textContent = fmt(summary.avg_cost_per_gram);

  const pnl = summary.total_pnl;
  const pnlEl = document.getElementById('summary-pnl');
  const pnlPct = document.getElementById('summary-pnl-pct');
  const pnlCard = document.getElementById('summary-pnl-card');
  if (pnl !== null && pnl !== undefined) {
    pnlEl.textContent = fmtCny(pnl);
    pnlEl.className = `card-value ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`;
    pnlPct.textContent = `${summary.total_pnl_pct >= 0 ? '+' : ''}${fmt(summary.total_pnl_pct)}%`;
    pnlCard.className = `price-card ${pnl >= 0 ? 'positive' : 'negative'}`;
  }

  // Table
  const tbody = document.getElementById('positions-body');
  tbody.innerHTML = data.map(p => {
    const pnl   = p.floating_pnl;
    const pnlPct = p.floating_pnl_pct;
    const pnlCls = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
    const sign   = pnl >= 0 ? '+' : '';
    return `
      <tr>
        <td>${p.bank}</td>
        <td>${p.product}</td>
        <td>${p.open_date}</td>
        <td>${fmt(p.open_price)}</td>
        <td>${fmt(p.grams, 4)}</td>
        <td>${fmtCny(p.amount_cny)}</td>
        <td>${p.current_value ? fmtCny(p.current_value) : '--'}</td>
        <td class="${pnlCls}">${pnl !== undefined ? `${sign}${fmtCny(pnl)}` : '--'}</td>
        <td class="${pnlCls}">${pnlPct !== undefined ? `${sign}${fmt(pnlPct)}%` : '--'}</td>
        <td>
          <span class="badge badge-${p.status}">${p.status === 'open' ? '持有' : '已平仓'}</span>
          ${p.status === 'open' ? `
            <button class="btn btn-sm btn-secondary" style="margin-left:4px"
              onclick="openClosePosition(${p.id})">平仓</button>
            <button class="btn btn-sm btn-danger" style="margin-left:4px"
              onclick="deletePosition(${p.id})">删除</button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--text3)">暂无持仓记录</td></tr>';
}

function openClosePosition(id) {
  document.querySelector('#form-close-position [name="position_id"]').value = id;
  openModal('modal-close-position');
}

async function deletePosition(id) {
  if (!confirm('确认删除此持仓记录？')) return;
  await apiFetch(`/api/positions/${id}`, { method: 'DELETE' });
  showToast('持仓已删除', 'success');
  loadPositions();
}

async function analyzePositions() {
  const section = document.getElementById('position-analysis-section');
  const content = document.getElementById('position-analysis-content');
  section.classList.remove('hidden');
  content.textContent = 'AI 分析中...';
  try {
    const res = await apiFetch('/api/ai/position-analysis', { method: 'POST' });
    content.textContent = res.analysis;
  } catch (e) {
    content.textContent = `分析失败: ${e.message}`;
  }
}

// ── Trading Plans ──────────────────────────────────────────────────────────
async function loadPlans() {
  const res = await apiFetch('/api/plans');
  const tbody = document.getElementById('plans-body');
  tbody.innerHTML = (res.data || []).map(p => `
    <tr>
      <td>${p.title}</td>
      <td>${planTypeLabel(p.plan_type)}</td>
      <td>${p.bank || '--'}</td>
      <td>${fmt(p.target_price)}</td>
      <td>${p.target_grams ? fmt(p.target_grams, 4) : '--'}</td>
      <td>${(p.condition || '--').slice(0, 60)}</td>
      <td><span class="badge badge-${p.status}">${planStatusLabel(p.status)}</span></td>
      <td>
        ${p.status === 'active' ? `
          <button class="btn btn-sm btn-secondary"
            onclick="updatePlanStatus(${p.id},'completed')">完成</button>
          <button class="btn btn-sm btn-secondary" style="margin-left:4px"
            onclick="updatePlanStatus(${p.id},'cancelled')">取消</button>
        ` : ''}
        <button class="btn btn-sm btn-danger" style="margin-left:4px"
          onclick="deletePlan(${p.id})">删除</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3)">暂无交易计划</td></tr>';
}

async function updatePlanStatus(id, status) {
  await apiFetch(`/api/plans/${id}/status?status=${status}`, { method: 'PUT' });
  showToast('计划状态已更新', 'success');
  loadPlans();
}

async function deletePlan(id) {
  if (!confirm('确认删除此计划？')) return;
  await apiFetch(`/api/plans/${id}`, { method: 'DELETE' });
  showToast('计划已删除', 'success');
  loadPlans();
}

// ── Alerts ─────────────────────────────────────────────────────────────────
async function loadAlerts() {
  const res = await apiFetch('/api/alerts');
  const tbody = document.getElementById('alerts-body');
  tbody.innerHTML = (res.data || []).map(a => `
    <tr>
      <td>${a.alert_type === 'above' ? '高于 ▲' : '低于 ▼'}</td>
      <td>${priceTypeLabel(a.price_type)}</td>
      <td>${fmt(a.threshold)}</td>
      <td>${a.message || '--'}</td>
      <td><span class="badge badge-${a.status}">${alertStatusLabel(a.status)}</span></td>
      <td>${a.triggered_at ? new Date(a.triggered_at + 'Z').toLocaleString('zh-CN') : '--'}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteAlert(${a.id})">删除</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text3)">暂无价格预警</td></tr>';
}

async function deleteAlert(id) {
  if (!confirm('确认删除此预警？')) return;
  await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' });
  showToast('预警已删除', 'success');
  loadAlerts();
}

// ── Calendar ───────────────────────────────────────────────────────────────
async function loadCalendar() {
  const res = await apiFetch('/api/calendar?days=14');
  const tbody = document.getElementById('calendar-body');
  tbody.innerHTML = (res.data || []).map(e => `
    <tr>
      <td>${e.event_date}</td>
      <td>${e.event_time || '--'}</td>
      <td>${e.country || '--'}</td>
      <td>${e.event_name}</td>
      <td><span class="badge badge-${e.importance}">${importanceLabel(e.importance)}</span></td>
      <td>${e.forecast || '--'}</td>
      <td>${e.previous || '--'}</td>
      <td>${e.actual || '--'}</td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text3)">暂无经济事件</td></tr>';
}

// ── Reviews ────────────────────────────────────────────────────────────────
async function loadReviews() {
  const res = await apiFetch('/api/reviews');
  const list = document.getElementById('reviews-list');
  list.innerHTML = (res.data || []).map(r => `
    <div class="review-card">
      <div class="review-header">
        <div>
          <div class="review-title">${r.title || '策略复盘'}</div>
          <div class="review-meta">${r.review_date} ·
            <span class="mood-badge mood-${r.mood || 'neutral'}">${moodLabel(r.mood)}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteReview(${r.id})">删除</button>
      </div>
      ${r.action_taken ? `<div style="font-size:12px;color:var(--text2);margin-bottom:8px">操作: ${r.action_taken}</div>` : ''}
      <div class="markdown-body" style="font-size:13px">${marked.parse(r.content || '')}</div>
    </div>
  `).join('') || '<div class="empty-state"><div class="empty-icon">▦</div><p>暂无复盘记录</p></div>';
}

async function deleteReview(id) {
  if (!confirm('确认删除此复盘记录？')) return;
  await apiFetch(`/api/reviews/${id}`, { method: 'DELETE' });
  showToast('已删除', 'success');
  loadReviews();
}

// ── Form Handlers ──────────────────────────────────────────────────────────
function initForms() {
  // Position form
  document.getElementById('form-position').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-position');
    await apiFetch('/api/positions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        open_price: +data.open_price,
        grams: +data.grams,
        amount_cny: +data.amount_cny,
        fee_cny: +(data.fee_cny || 0),
      }),
    });
    closeModal('modal-position');
    showToast('持仓已添加', 'success');
    loadPositions();
  });

  // Plan form
  document.getElementById('form-plan').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-plan');
    await apiFetch('/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        target_price:  +data.target_price,
        target_grams:  data.target_grams  ? +data.target_grams  : null,
        target_amount: data.target_amount ? +data.target_amount : null,
      }),
    });
    closeModal('modal-plan');
    showToast('交易计划已创建', 'success');
    loadPlans();
  });

  // Alert form
  document.getElementById('form-alert').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-alert');
    await apiFetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ ...data, threshold: +data.threshold }),
    });
    closeModal('modal-alert');
    showToast('价格预警已创建', 'success');
    loadAlerts();
  });

  // Review form
  document.getElementById('form-review').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-review');
    await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
    closeModal('modal-review');
    showToast('复盘记录已保存', 'success');
    loadReviews();
  });

  // Calendar event form
  document.getElementById('form-calendar').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-calendar');
    await apiFetch('/api/calendar', { method: 'POST', body: JSON.stringify(data) });
    closeModal('modal-calendar');
    showToast('事件已添加', 'success');
    loadCalendar();
  });

  // Close position form
  document.getElementById('form-close-position').addEventListener('submit', async e => {
    e.preventDefault();
    const data = getFormData('form-close-position');
    const id = +data.position_id;
    await apiFetch(`/api/positions/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ close_date: data.close_date, close_price: +data.close_price }),
    });
    closeModal('modal-close-position');
    showToast('持仓已平仓', 'success');
    loadPositions();
  });
}

// ── Button Bindings ────────────────────────────────────────────────────────
function initButtons() {
  document.getElementById('btn-refresh').addEventListener('click', async () => {
    const btn = document.getElementById('btn-refresh');
    btn.textContent = '刷新中...';
    btn.disabled = true;
    try {
      await apiFetch('/api/prices/refresh', { method: 'POST' });
      showToast('数据刷新中，请稍后...', 'success');
      setTimeout(() => { loadLatestPrice(); loadPriceChart(currentChartDays); }, 5000);
    } finally {
      btn.textContent = '刷新数据';
      btn.disabled = false;
    }
  });

  document.getElementById('btn-gen-brief').addEventListener('click', generateBrief);
  document.getElementById('btn-add-position').addEventListener('click', () => openModal('modal-position'));
  document.getElementById('btn-analyze-positions').addEventListener('click', analyzePositions);
  document.getElementById('btn-add-plan').addEventListener('click', () => openModal('modal-plan'));
  document.getElementById('btn-add-alert').addEventListener('click', () => openModal('modal-alert'));
  document.getElementById('btn-add-review').addEventListener('click', () => openModal('modal-review'));
  document.getElementById('btn-add-calendar').addEventListener('click', () => openModal('modal-calendar'));
}

// ── Modal Helpers ──────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  const form = document.querySelector(`#${id} form`);
  if (form) form.reset();
  setTodayDefaults();
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

// ── Utilities ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function getFormData(formId) {
  const form = document.getElementById(formId);
  const data = {};
  new FormData(form).forEach((val, key) => {
    data[key] = val.trim() === '' ? null : val;
  });
  return data;
}

function fmt(val, decimals = 2) {
  if (val === null || val === undefined) return '--';
  return Number(val).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCny(val) {
  if (val === null || val === undefined) return '--';
  return '¥' + Number(val).toLocaleString('zh-CN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function recLabel(rec) {
  const map = { HOLD: '持有', BUY: '分批买入', SELL: '分批减仓', WAIT: '观望' };
  return map[rec] || rec || '--';
}

function planTypeLabel(t) {
  const map = { buy: '分批买入', sell: '分批减仓', stop_loss: '止损', take_profit: '止盈' };
  return map[t] || t;
}

function planStatusLabel(s) {
  const map = { active: '进行中', triggered: '已触发', cancelled: '已取消', completed: '已完成' };
  return map[s] || s;
}

function alertStatusLabel(s) {
  const map = { active: '监控中', triggered: '已触发', snoozed: '已暂停', disabled: '已禁用' };
  return map[s] || s;
}

function priceTypeLabel(t) {
  const map = {
    domestic: '国内现货', international: '国际现货',
    bank_icbc: '工行积存金', bank_ccb: '建行龙鼎金',
    bank_boc: '中行积存金', bank_abc: '农行积存金', bank_cmb: '招行招财金',
  };
  return map[t] || t;
}

function importanceLabel(i) {
  const map = { high: '高', medium: '中', low: '低' };
  return map[i] || i;
}

function moodLabel(m) {
  const map = { confident: '信心充足', cautious: '谨慎', anxious: '焦虑', neutral: '平静' };
  return map[m] || '平静';
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 4000);
}
