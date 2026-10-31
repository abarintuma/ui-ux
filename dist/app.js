/* Budgetwise UI: small render functions, hash navigation, and local persistence. */
'use strict';
const M = window.BudgetModel;
const STORE = 'budgetwise-v1';
const SESSION = 'budgetwise-login-session-v2';

// This client-side verifier supports the coursework sign-in flow.
// Production authentication requires a server-side session boundary.
const LOGIN_SALT = '4dda11ab625f920a6a308d5818fbe694';
const LOGIN_VERIFIER = '34c18c691d38f0e2862b2ad385c57e06cf83543c685cb167fb2da0da4305de80';
async function matchesLogin(email, password) {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', encoder.encode(email.trim().toLowerCase() + '\0' + password), 'PBKDF2', false, ['deriveBits']);
  const salt = Uint8Array.from(LOGIN_SALT.match(/../g), part => parseInt(part, 16));
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:210000, hash:'SHA-256'}, material, 256);
  const candidate = Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
  return candidate === LOGIN_VERIFIER;
}

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const toastBox = document.querySelector('#toast');
const paths = {
  leaf:'M5 20C5 10 8 4 20 4c0 12-6 15-15 15m0 0 9-9',
  logo:'M4 19V11a8 8 0 0 1 16 0v8M8 19v-8a4 4 0 0 1 8 0v8M12 19v-8',
  dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  transactions:'m5 7 3-3 3 3M8 4v12m11 1-3 3-3-3m3 3V8',
  budgets:'M3 8h18v12H3zM3 8l3-4h12l3 4M9 12h6',
  reports:'M4 20V10m5 10V4m6 16v-7m5 7V7',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  plus:'M12 5v14M5 12h14',
  arrow:'M5 12h14m-5-5 5 5-5 5',
  down:'M7 7l10 10M7 17h10V7',
  up:'M7 17 17 7M7 7h10v10',
  chevron:'m9 5 7 7-7 7',
  search:'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15m5.5 13 5 5',
  calendar:'M5 5h14v16H5zM8 3v4m8-4v4M5 11h14',
  wallet:'M4 6h15v14H4zM4 6V4h13v2m-2 7h6v4h-6z',
  income:'M12 3v14m-5-5 5 5 5-5M4 17v4h16v-4',
  expense:'M12 17V3m-5 5 5-5 5 5M4 17v4h16v-4',
  target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0 4h.01',
  home:'m3 10 9-7 9 7M5 9v12h14V9m-10 12v-8h6v8',
  food:'M4 3v7m4-7v7m-4-3h4m-2 3v11m12-18c-5 2-6 9-2 9h2m0-9v18',
  transport:'M5 6h14l2 10H3L5 6zM5 16v4m14-4v4M6 12h.01M18 12h.01M7 3h10',
  bolt:'m13 2-8 12h7l-1 8 8-12h-7l1-8z',
  book:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3V4zm9 2v16',
  health:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z',
  leisure:'M9 18V5l11-2v13M9 5l11-2M5 15c-5 0-5 6 0 6s5-6 0-6m11-2c-5 0-5 6 0 6s5-6 0-6',
  edit:'m15 3 6 6-12 12H3v-6L15 3zm-3 3 6 6',
  trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  logout:'M10 4H4v16h6m-1-8h12m-5-5 5 5-5 5',
  check:'m5 12 4 4L19 6',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3zm-4 9 3 3 5-6',
  info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 8v6m0-10h.01',
  menu:'M4 6h16M4 12h16M4 18h16',
  close:'m6 6 12 12M6 18 18 6',
  light:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.wallet}"/></svg>`;
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money = value => new Intl.NumberFormat('en-UG', {maximumFractionDigits:0}).format(value);
const ugx = value => 'UGX ' + money(value);
const monthLabel = value => new Date(value + '-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'});
const dateLabel = value => new Date(value + 'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const pretty = value => value[0].toUpperCase() + value.slice(1);
const categoryIcon = category => ({Housing:'home','Food & groceries':'food',Transport:'transport',Utilities:'bolt',Education:'book',Health:'health',Leisure:'leisure'}[category] || 'wallet');
const colors = ['#32634a','#7d9a62','#b8c98e','#dbb371','#b7866a','#91b4a3','#bbc5b0','#d4d8c9'];
let storageWarning = '';
let state = loadState();
let signedIn = false;
try { signedIn = sessionStorage.getItem(SESSION) === 'yes'; } catch { /* A session can still run in memory. */ }
let month = '2026-10';
let filters = {type:'all',category:'all',search:'',sort:'newest'};
let lastSaved = null;
let undoAction = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (M.validState(parsed)) {
        if (parsed.profile.email) {
          parsed.profile.name = M.seed().profile.name;
          parsed.profile.email = '';
        }
        return parsed;
      }
      storageWarning = 'Saved demo data could not be read. Sample data is shown; your existing stored data has not been overwritten.';
    }
  } catch { storageWarning = 'Browser storage is unavailable. You can explore sample data, but changes cannot be saved.'; }
  return M.seed();
}
function persist(next) {
  try {
    localStorage.setItem(STORE, JSON.stringify(next));
    state = next;
    storageWarning = '';
    return true;
  } catch {
    showToast('Changes were not saved. Browser storage may be full or unavailable.', null, true);
    return false;
  }
}
function cloneState() { return JSON.parse(JSON.stringify(state)); }
function newTransactionId() {
  // These are local record IDs, not security tokens. The fallback also works
  // when opening the assignment through an ordinary HTTP preview or file URL.
  let id;
  do { id='tx-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10); }
  while(state.transactions.some(t=>t.id===id));
  return id;
}
function showToast(message, undo = null, isError = false) {
  undoAction = undo;
  toastBox.className = 'toast' + (isError ? ' error-toast' : '');
  toastBox.innerHTML = `<span>${esc(message)}</span>${undo ? '<button type="button" data-action="undo">Undo</button>' : ''}<button type="button" data-action="dismiss-toast" aria-label="Dismiss notification">${icon('close')}</button>`;
  toastBox.hidden = false;
}
function setSession(value) {
  signedIn = value;
  try { if (value) sessionStorage.setItem(SESSION,'yes'); else sessionStorage.removeItem(SESSION); } catch { /* Session remains in memory. */ }
}
function navigate(route) {
  if (location.hash === '#/' + route) render();
  else location.hash = '#/' + route;
}
function currentRoute() { return location.hash.replace(/^#\/?/,'') || 'dashboard'; }
function brand() { return `<span class="brand"><span class="brand-mark">${icon('logo')}</span>budgetwise<span style="color:#b9d58a">.</span></span>`; }
function login() {
  document.title = 'Welcome · Budgetwise';
  app.innerHTML = `<main id="main" class="login" tabindex="-1">
    <section class="login-story" aria-label="About Budgetwise">${brand()}
      <div class="login-copy"><span class="eyebrow">Small steps. A clearer picture.</span><h1>A little clarity.<br>A lot more<br><em>possibility.</em></h1><p>Make room for what matters. Keep your income, everyday spending, and next goals in one simple place.</p>
      <div class="mini-budget" aria-hidden="true"><div class="between"><span class="small muted">Your monthly balance</span><span class="tag">Looking good</span></div><div class="big-number">${ugx(M.totals(M.monthTransactions(M.seed().transactions,"2026-10")).balance)}</div><div class="between small"><span>More breathing room.</span>${icon('up')}</div><div class="track"><span style="width:63%"></span></div></div>
      <div class="login-feature"><span class="brand-mark">${icon('leaf')}</span><div><strong>A calmer way to manage your money</strong><small>Built for everyday life, one transaction at a time.</small></div></div></div>
      <div class="login-foot">PERSONAL BUDGET MANAGEMENT · MADE FOR YOUR EVERYDAY</div>
    </section>
    <section class="login-form-wrap"><span class="login-top-note tag">Personal budget</span><div class="login-form"><span class="eyebrow">Welcome to your fresh start</span><h1>Good to have you here.</h1><p class="subtitle">Sign in to see where your money goes.</p>
      <form id="login-form" novalidate><div class="field"><label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required aria-describedby="login-error"></div>
      <div class="field"><label for="login-password">Password</label><div class="password-wrap"><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required aria-describedby="login-error"><button type="button" class="icon-btn" data-action="toggle-password" aria-label="Show password">${icon('eye')}</button></div></div>
      <p id="login-error" class="error" role="alert"></p><button class="btn full" type="submit">Sign in ${icon('arrow')}</button></form>
    </div></section></main>`;
}
function shell(route) {
  const names = {dashboard:'Overview',transactions:'Transactions',budgets:'Budgets',reports:'Reports',settings:'Settings',add:'Add transaction',summary:'Updated summary',edit:'Edit transaction'};
  const nav = [['dashboard','dashboard','Overview'],['transactions','transactions','Transactions'],['budgets','budgets','Budgets'],['reports','reports','Reports']];
  const initials = state.profile.name.trim().split(/\s+/).map(n => n[0]).slice(0,2).join('').toUpperCase();
  app.innerHTML = `<button class="mobile-overlay" data-action="close-menu" aria-label="Close navigation"></button><aside class="sidebar" id="sidebar" aria-label="Workspace navigation">${brand()}<div class="workspace"><div class="eyebrow">YOUR WORKSPACE</div><strong>Personal budget</strong></div><nav aria-label="Main navigation">${nav.map(([key,ico,name]) => `<a class="nav-link ${route === key ? 'active' : ''}" href="#/${key}" ${route === key ? 'aria-current="page"' : ''}>${icon(ico)}${name}</a>`).join('')}</nav><div class="sidebar-grow"></div><div class="sidebar-note">${icon('leaf')}<strong>Little habits.<br>Brighter tomorrows.</strong><p>Every recorded expense is a small step toward knowing your money better.</p></div><a class="nav-link ${route === 'settings' ? 'active' : ''}" href="#/settings" ${route === 'settings' ? 'aria-current="page"' : ''}>${icon('settings')}Settings</a><button class="nav-link" style="border:0;background:transparent;text-align:left" data-action="logout">${icon('logout')}Sign out</button><a href="#/settings" class="profile-link"><span class="avatar">${esc(initials)}</span><span><strong>${esc(state.profile.name)}</strong><small>Personal workspace</small></span>${icon('chevron')}</a></aside>
    <div class="content-wrap"><header class="topbar"><div class="inline"><button class="icon-btn menu-btn" data-action="open-menu" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><div class="breadcrumb"><span>Workspace</span>${icon('chevron')}<strong>${names[route] || 'Overview'}</strong></div></div><div class="topbar-actions"><span class="tag neutral">${icon('shield')}Personal workspace</span><span class="small muted">UGX</span><span class="header-rule"></span><span class="avatar" aria-label="${esc(state.profile.name)}">${esc(initials)}</span></div></header><main id="main" class="workspace-main" tabindex="-1">${storageWarning ? `<p class="month-empty" role="alert">${esc(storageWarning)}</p>` : ''}<div id="page"></div><footer class="workspace-footer"><span><strong>Made for your everyday.</strong> &nbsp; One good money habit at a time.</span><span>Saved in this browser · UGX</span></footer></main></div>`;
}
function monthPicker() { return `<div class="month-picker"><label for="active-month">Budget month</label><input id="active-month" type="month" min="2000-01" max="2100-12" value="${month}"></div>`; }
function heading(title, description, actions = '') {
  return `<div class="page-heading"><div><p class="eyebrow">YOUR MONEY, IN PERSPECTIVE</p><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${monthPicker()}${actions}</div></div>`;
}
function addButton() { return `<a class="btn" href="#/add">${icon('plus')}Add transaction</a>`; }
function stats(data) {
  const total = M.totals(data);
  return `<section class="stats-grid" aria-label="Monthly budget summary"><article class="stat-card primary"><div class="stat-label">Available balance ${icon('wallet')}</div><div class="value"><small class="currency">UGX</small>${money(total.balance)}</div><p><span class="tag">${pretty(total.status)}</span> &nbsp; Income minus expenses</p></article><article class="stat-card"><div class="stat-label">Total income ${icon('income')}</div><div class="value"><small class="currency">UGX</small>${money(total.income)}</div><p>${data.filter(t=>t.type==='income').length} income transactions this month</p></article><article class="stat-card"><div class="stat-label">Total expenses ${icon('expense')}</div><div class="value"><small class="currency">UGX</small>${money(total.expenses)}</div><p>${data.filter(t=>t.type==='expense').length} expense transactions this month</p></article><article class="stat-card"><div class="stat-label">Savings rate ${icon('target')}</div><div class="value">${total.savingsRate === null ? '—' : total.savingsRate + '<small>%</small>'}</div><p>${total.savingsRate === null ? 'Add income to calculate your rate' : 'Of your income remains unspent'}</p></article></section>`;
}
function cashflow() {
  const [year,mm] = month.split('-').map(Number);
  const months = Array.from({length:6},(_,i) => {const date=new Date(year,mm-6+i,1);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');});
  const rows = months.map(m => ({month:m,...M.totals(M.monthTransactions(state.transactions,m))}));
  const max = Math.max(1000000,...rows.map(r=>Math.max(r.income,r.expenses)));
  const ceiling = Math.ceil(max / 500000) * 500000;
  const compact = n => n>=1e6 ? (n/1e6)+'m' : n>=1000 ? (n/1000)+'k' : n;
  return `<div class="section-head"><div><h2>Your cash flow</h2><p>The bigger picture, month by month</p></div><div class="legend"><span><i></i>Income</span><span><i class="expense"></i>Expenses</span></div></div><div class="chart" role="img" aria-label="Income and expenses for the last six months. Exact values are in the data table below."><div class="chart-grid">${[ceiling,ceiling/2,0].map(v=>`<span><small>${compact(v)}</small></span>`).join('')}</div>${rows.map(r=>`<div class="chart-group"><div class="chart-bar" style="height:${r.income/ceiling*100}%" title="${monthLabel(r.month)} income: ${ugx(r.income)}"></div><div class="chart-bar expense" style="height:${r.expenses/ceiling*100}%" title="${monthLabel(r.month)} expenses: ${ugx(r.expenses)}"></div><span class="chart-label">${new Date(r.month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'short'})}</span></div>`).join('')}</div><details class="chart-table"><summary>View cash flow as a table</summary><table><caption class="screen-reader">Six-month cash flow in UGX</caption><thead><tr><th>Month</th><th>Income</th><th>Expenses</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${monthLabel(r.month)}</td><td>${money(r.income)}</td><td>${money(r.expenses)}</td></tr>`).join('')}</tbody></table></details>`;
}
function spending(data) {
  const list=M.categoryTotals(data).filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent);
  const total=list.reduce((s,c)=>s+c.spent,0);
  let angle=0;
  const gradient=list.map((c,i)=>{const start=angle;angle+=c.spent/total*360;return `${colors[i]} ${start}deg ${angle}deg`;}).join(',');
  return `<div class="section-head"><div><h2>Where it goes</h2><p>Spending by category</p></div><a class="text-link" href="#/reports">Details ${icon('arrow')}</a></div>${total ? `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${gradient})" role="img" aria-label="Spending categories, listed alongside"><div class="donut-center"><small>TOTAL SPENT · UGX</small><strong>${money(total)}</strong></div></div><div class="category-list">${list.slice(0,5).map((c,i)=>`<div class="category-row"><span class="category-dot" style="background:${colors[i]}"></span><span>${esc(c.category)}</span><strong>${Math.round(c.spent/total*100)}%</strong></div>`).join('')}${list.length>5 ? `<div class="small muted">+ ${list.length-5} more in Reports</div>` : ''}</div></div>` : `<div class="empty">${icon('wallet')}<h3>A fresh page for this month</h3><p>Add your first expense to see where your money goes.</p></div>`}<div class="insight">${icon('light')}<p>${total ? `<strong>${esc(list[0].category)}</strong> is your largest category at ${ugx(list[0].spent)} this month.` : 'Your categories will update automatically as you record expenses.'}</p></div>`;
}
function transactionTable(data, actions = false) {
  if (!data.length) return `<div class="empty">${icon('search')}<h3>No transactions to show</h3><p>Try another search or month, or record your first transaction.</p>${addButton()}</div>`;
  return `<div class="table-wrap"><table><caption class="screen-reader">Transactions for ${monthLabel(month)}, amounts in Uganda shillings</caption><thead><tr><th>Transaction</th><th class="hide-mobile">Category</th><th class="hide-mobile">Date</th><th style="text-align:right">Amount (UGX)</th>${actions ? '<th><span class="screen-reader">Actions</span></th>' : ''}</tr></thead><tbody>${data.map(t=>`<tr><td><div class="transaction-name"><span class="category-icon ${t.type}">${icon(t.type==='income'?'income':categoryIcon(t.category))}</span><span><strong>${esc(t.description)}</strong><small>${t.type==='income'?'Income':'Expense'} · ${dateLabel(t.date)}</small></span></div></td><td class="hide-mobile"><span class="tag neutral category-pill">${esc(t.category)}</span></td><td class="hide-mobile muted">${dateLabel(t.date)}</td><td class="amount ${t.type}">${t.type==='income'?'+':'−'}${money(t.amount)}</td>${actions ? `<td><div class="row-actions"><a class="icon-btn" href="#/edit/${encodeURIComponent(t.id)}" aria-label="Edit ${esc(t.description)}">${icon('edit')}</a><button class="icon-btn" data-action="delete" data-id="${esc(t.id)}" aria-label="Delete ${esc(t.description)}">${icon('trash')}</button></div></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
function budgetMini(data) {
  const limits=state.budgets[month] || {};
  const cats=M.categoryTotals(data).filter(c=>limits[c.category]).sort((a,b)=>b.spent/limits[b.category]-a.spent/limits[a.category]).slice(0,3);
  return `<div class="section-head"><div><h2>A little room to plan</h2><p>Your category budgets</p></div><a href="#/budgets" class="text-link">View all ${icon('arrow')}</a></div>${cats.length ? cats.map(c=>{const pct=Math.round(c.spent/limits[c.category]*100);return `<div class="budget-mini"><div class="between"><span>${esc(c.category)}</span><small>${money(c.spent)} / ${money(limits[c.category])}</small></div><div class="track ${pct>100?'over':pct>=80?'warning':''}"><span style="width:${Math.min(pct,100)}%"></span></div><div class="small muted" style="margin-top:5px">${pct}% used${pct>100?' · Over budget':''}</div></div>`;}).join('') : `<div class="empty">${icon('budgets')}<h3>Give your spending a plan</h3><p>Set your first category limit for ${monthLabel(month)}.</p><a class="text-link" href="#/budgets">Plan a budget ${icon('arrow')}</a></div>`}`;
}
function dashboard() {
  const data=M.monthTransactions(state.transactions,month);
  const recent=M.searchTransactions(state.transactions,{month}).slice(0,5);
  return heading(`A clearer month, ${esc(state.profile.name.split(' ')[0])}.`,'Here’s how your money is looking. You’re in the right place.',addButton()) + stats(data) + `<div class="dashboard-grid"><section class="panel">${cashflow()}</section><section class="panel">${spending(data)}</section></div><div class="dashboard-grid bottom-grid"><section class="panel"><div class="section-head"><div><h2>The latest little things</h2><p>Your recent transactions</p></div><a class="text-link" href="#/transactions">View all ${icon('arrow')}</a></div>${transactionTable(recent)}</section><section class="panel">${budgetMini(data)}</section></div>`;
}
function transactions() {
  const data=M.searchTransactions(state.transactions,{month,...filters});
  return heading('Every little thing, recorded.','A home for your income, expenses, and the details in between.',addButton()) + `<section class="panel"><div class="section-head"><div><h2>Your transactions</h2><p id="results-count">${data.length} matching transactions · ${monthLabel(month)}</p></div><button class="btn secondary" data-action="export">${icon('download')}Export CSV</button></div><div class="filters"><div class="search">${icon('search')}<label for="transaction-search" class="screen-reader">Search transactions</label><input id="transaction-search" type="search" placeholder="Search description, category, or note…" value="${esc(filters.search)}"></div><label for="filter-type" class="screen-reader">Transaction type</label><select id="filter-type">${['all','income','expense'].map(v=>`<option value="${v}" ${filters.type===v?'selected':''}>${v==='all'?'All types':pretty(v)}</option>`).join('')}</select><label for="filter-category" class="screen-reader">Category</label><select id="filter-category"><option value="all">All categories</option>${[...M.categories.income,...M.categories.expense].map(v=>`<option ${filters.category===v?'selected':''}>${esc(v)}</option>`).join('')}</select><label for="filter-sort" class="screen-reader">Sort transactions</label><select id="filter-sort">${[['newest','Newest first'],['oldest','Oldest first'],['largest','Largest amount']].map(([v,label])=>`<option value="${v}" ${filters.sort===v?'selected':''}>${label}</option>`).join('')}</select></div><div id="ledger-results">${transactionTable(data,true)}</div><p class="download-note">Expense amounts are shown with a minus sign. Export includes only the transactions matching your current filters.</p></section>`;
}
function budgets() {
  const data=M.monthTransactions(state.transactions,month);
  const limits=state.budgets[month] || {};
  const list=M.categoryTotals(data);
  const planned=Object.values(limits).reduce((s,v)=>s+v,0);
  const spentPlanned=list.filter(c=>limits[c.category]).reduce((s,c)=>s+c.spent,0);
  const over=list.filter(c=>limits[c.category] && c.spent>limits[c.category]).length;
  return heading('Make room for what matters.','Set a spending limit for each category. Small plans make a difference.',`<button class="btn" data-action="budget">${icon('plus')}Set a budget</button>`) + `<div class="budget-summary"><div><strong>${ugx(planned)} planned for ${monthLabel(month)}</strong><p>${ugx(spentPlanned)} spent across categories with a limit. Categories without a limit are excluded.</p></div><span class="tag ${over?'warning':''}">${over ? over+' over budget' : 'Your plan, your pace'}</span></div><div class="budget-grid">${list.map(c=>{const limit=limits[c.category];const pct=limit?Math.round(c.spent/limit*100):0;return `<article class="panel budget-card"><div class="between"><span class="category-icon">${icon(categoryIcon(c.category))}</span><button class="icon-btn" data-action="budget" data-category="${esc(c.category)}" aria-label="${limit?'Edit':'Set'} ${esc(c.category)} budget">${icon('edit')}</button></div><h3>${esc(c.category)}</h3><p>${limit?'Monthly category budget':'No spending limit set'}</p><div class="spent-value">${money(c.spent)} <span class="small muted">UGX</span></div><p>${limit?'of '+ugx(limit)+' planned':'spent this month'}</p><div class="track ${pct>100?'over':pct>=80?'warning':''}"><span style="width:${Math.min(pct,100)}%"></span></div><div class="budget-foot"><span>${limit ? pct+'% used' : 'Set a limit to track progress'}</span>${limit?`<span class="tag ${pct>100?'negative':pct>=80?'warning':''}">${pct>100?ugx(c.spent-limit)+' over':ugx(limit-c.spent)+' left'}</span>`:''}</div></article>`;}).join('')}</div>`;
}
function reports() {
  const data=M.monthTransactions(state.transactions,month), total=M.totals(data);
  const cats=M.categoryTotals(data).filter(c=>c.spent).sort((a,b)=>b.spent-a.spent);
  const goal=state.profile.savingsGoal;
  const remaining=Math.max(0,goal-total.balance);
  return heading('A moment to see the bigger picture.','Understand the month behind you, and plan the one ahead.',`<button class="btn secondary" data-action="export-report">${icon('download')}Export month</button>`) + stats(data) + `<div class="report-grid"><section class="panel">${cashflow()}</section><section class="panel"><div class="section-head"><div><h2>Your month at a glance</h2><p>${monthLabel(month)}</p></div><span class="tag ${total.status==='deficit'?'negative':''}">${pretty(total.status)}</span></div><div class="metric-detail"><span>Income recorded</span><strong>${ugx(total.income)}</strong></div><div class="metric-detail"><span>Expenses recorded</span><strong>${ugx(total.expenses)}</strong></div><div class="metric-detail"><span>Remaining balance</span><strong>${ugx(total.balance)}</strong></div><div class="metric-detail"><span>Monthly savings goal</span><strong>${ugx(goal)}</strong></div><div class="status-box"><strong>${goal===0?'Set a goal, at your own pace':remaining===0?'You’ve reached your savings goal':'Your next small step'}</strong><p>${goal===0?'Add a monthly savings goal in Settings.':remaining===0?'Your remaining balance meets or exceeds your goal.':ugx(remaining)+' more remaining balance would meet your current goal.'}</p></div></section><section class="panel"><div class="section-head"><div><h2>Your spending, in detail</h2><p>Exact category totals for the selected month</p></div></div>${cats.length?`<table><thead><tr><th>Category</th><th style="text-align:right">Spent (UGX)</th><th style="text-align:right">Share</th></tr></thead><tbody>${cats.map((c,i)=>`<tr><td><span class="category-dot" style="background:${colors[i]};margin-right:9px"></span>${esc(c.category)}</td><td class="amount">${money(c.spent)}</td><td style="text-align:right">${(c.spent/total.expenses*100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No expenses recorded for this month.</p>'}</section><section class="panel">${spending(data)}</section></div>`;
}
function transactionForm(existing = null) {
  const t=existing || {type:'expense',description:'',amount:'',category:'',date:month==='2026-10'?'2026-10-24':month+'-01',note:''};
  return heading(existing?'A detail worth getting right.':'One small entry. A clearer picture.',existing?'Update your transaction and we’ll take care of the totals.':'Record what came in or went out. We’ll do the rest.',`<a class="btn secondary" href="#/transactions">Back to transactions</a>`) + `<div class="form-layout"><section class="panel"><h2 class="form-heading">${existing?'Edit transaction':'Add a transaction'}</h2><form id="transaction-form" data-edit-id="${existing?esc(existing.id):''}" novalidate><fieldset style="border:0;padding:0;margin:0"><legend class="screen-reader">Transaction type</legend><div class="type-toggle">${['expense','income'].map(type=>`<label><input type="radio" name="type" value="${type}" ${t.type===type?'checked':''}>${icon(type)}${pretty(type)}</label>`).join('')}</div></fieldset><div class="field"><label for="description">What was it for?</label><input id="description" name="description" required maxlength="80" value="${esc(t.description)}" placeholder="e.g. Weekly groceries" aria-describedby="description-error"><span class="error" id="description-error"></span></div><div class="two-fields"><div class="field"><label for="amount">Amount</label><div class="input-prefix"><span>UGX</span><input id="amount" name="amount" type="number" inputmode="numeric" min="1" max="1000000000" step="1" required value="${t.amount}" placeholder="0" aria-describedby="amount-help amount-error"></div><small id="amount-help">Whole shillings, up to 1 billion UGX</small><span class="error" id="amount-error"></span></div><div class="field"><label for="date">Date</label><input id="date" name="date" type="date" required min="2000-01-01" max="2100-12-31" value="${t.date}" aria-describedby="date-error"><span class="error" id="date-error"></span></div></div><div class="field"><label for="category">Category</label><select id="category" name="category" required aria-describedby="category-error">${categoryOptions(t.type,t.category)}</select><span class="error" id="category-error"></span></div><div class="field"><label for="note">A little note <span class="optional">(optional)</span></label><textarea id="note" name="note" maxlength="240" rows="3" placeholder="Anything you’d like to remember…" aria-describedby="note-error">${esc(t.note)}</textarea><span class="error" id="note-error"></span></div><p id="form-error" class="error" role="alert"></p><div class="form-actions"><a class="btn secondary" href="#/transactions">Cancel</a><button type="submit" class="btn">${icon('check')}${existing?'Save changes':'Save transaction'}</button></div></form></section><aside class="stack"><section class="panel"><span class="eyebrow">THE BIGGER PICTURE</span><h2 style="margin-top:12px">Your balance preview</h2><p class="small muted">See how this entry would change the balance for its month.</p><div id="balance-preview">${balancePreview(t,existing?.id)}</div></section><div class="form-tip">${icon('leaf')}<h3>It all adds up.</h3><p>Even the small things count. Recording them today makes tomorrow’s decisions a little easier.</p><p style="margin-top:13px">Expenses can exceed income. That’s recorded as a deficit, so you can see the full picture.</p></div></aside></div>`;
}
function categoryOptions(type,selected='') { return `<option value="">Choose a category</option>${M.categories[type].map(c=>`<option ${c===selected?'selected':''}>${esc(c)}</option>`).join('')}`; }
function balancePreview(t,editId) {
  const active=/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(t.date)?t.date.slice(0,7):month;
  const total=M.totals(M.monthTransactions(state.transactions.filter(x=>x.id!==editId),active));
  const amount=Number.isSafeInteger(t.amount) && t.amount>0 && t.amount<=M.maxAmount ? t.amount : 0;
  const next=total.balance+(t.type==='income'?amount:-amount);
  return `<div class="small muted" style="margin:22px 0">${monthLabel(active)}</div><div class="preview-line"><span>Balance before this entry</span><strong>${ugx(total.balance)}</strong></div><div class="preview-line"><span>${t.type==='income'?'Income to add':'Expense to subtract'}</span><strong>${t.type==='income'?'+':'−'}${ugx(amount)}</strong></div><div class="preview-line total"><span>New balance</span><strong>${ugx(next)}</strong></div><div class="status-box"><strong>${next>0?'A little breathing room':next<0?'Expenses exceed income':'All balanced'}</strong><p>${next>0?'Your income would still be above your expenses.':next<0?'Your balance would show a deficit.':'Your income and expenses would be equal.'}</p></div>`;
}
function summary() {
  const data=M.monthTransactions(state.transactions,month), total=M.totals(data);
  return `<div class="success-card"><div class="success-icon">${icon('check')}</div><div><h2 class="success-heading">${lastSaved?'All recorded. All up to date.':'Your month, brought together.'}</h2><p>${lastSaved?esc(lastSaved.description)+' · '+ugx(lastSaved.amount)+' · '+pretty(lastSaved.type):monthLabel(month)+' · A clear view of your income and expenses.'}</p></div><a class="btn light" href="#/add">${icon('plus')}Add another</a></div>`+heading('Here’s your updated picture.',`Your totals for ${monthLabel(month)} reflect every saved transaction.`,`<a class="btn secondary" href="#/dashboard">Go to overview ${icon('arrow')}</a>`)+stats(data)+`<div class="dashboard-grid"><section class="panel"><div class="section-head"><div><h2>${lastSaved?'Your latest entry':'Recent transactions'}</h2><p>${lastSaved?'Saved in this browser':'Your latest records for the selected month'}</p></div><a class="text-link" href="#/transactions">View transactions ${icon('arrow')}</a></div>${transactionTable(lastSaved && lastSaved.date.startsWith(month)?[lastSaved]:M.searchTransactions(state.transactions,{month}).slice(0,4))}<div class="status-box"><strong>${total.status==='surplus'?'Your income is ahead of your expenses.':total.status==='deficit'?'Your expenses are ahead of your income.':'Your income and expenses are balanced.'}</strong><p>The remaining balance is income minus expenses. Editing or removing a transaction updates this picture too.</p></div></section><section class="panel">${budgetMini(data)}</section></div>`;
}
function settings() {
  return heading('A workspace that feels like you.','Your preferences and your monthly savings goal.')+`<div class="settings-grid"><section class="panel"><div class="section-head"><div><h2>Your profile & goal</h2><p>These details stay in your browser</p></div></div><form id="settings-form" novalidate><div class="field"><label for="profile-name">Display name</label><input id="profile-name" name="name" value="${esc(state.profile.name)}" maxlength="40" required aria-describedby="settings-error"></div><div class="field"><label for="savings-goal">Monthly savings goal (UGX)</label><input id="savings-goal" name="goal" type="number" inputmode="numeric" min="0" max="1000000000" step="1" value="${state.profile.savingsGoal}" aria-describedby="settings-error"><small>Use a whole amount. Set 0 if you don’t want a goal.</small></div><p class="error" id="settings-error" role="alert"></p><div class="form-actions"><button class="btn" type="submit">Save preferences ${icon('check')}</button></div></form></section><div class="stack"><section class="panel"><h2>A note about your data</h2><div class="setting-note"><strong class="small">Saved on this device</strong><p>Your transactions and preferences are saved in this browser. Export a CSV to keep a copy of your records.</p></div><div class="setting-note"><strong class="small">Take a copy with you</strong><p>Download all your transactions as a CSV file.</p><button class="btn secondary" data-action="export-all">${icon('download')}Export all transactions</button></div></section><section class="panel settings-danger"><h2>A fresh starting point</h2><p class="small muted">Restore the original sample records, category limits, and profile. You can undo the reset from the notification.</p><button class="btn secondary" data-action="reset">Restore sample data</button></section></div></div>`;
}
function render() {
  if (dialog.open) dialog.close();
  if (!signedIn) { login(); return; }
  const route=currentRoute(), base=route.split('/')[0];
  shell(base);
  const views={dashboard,transactions,budgets,reports,settings,add:()=>transactionForm(),summary};
  let markup;
  if (base==='edit') {
    const item=state.transactions.find(t=>t.id===decodeURIComponent(route.slice(5)));
    markup=item?transactionForm(item):heading('This record isn’t here.','It may have been removed. Your other transactions are safe.',`<a class="btn" href="#/transactions">View transactions</a>`);
  } else markup=(views[base] || dashboard)();
  document.querySelector('#page').innerHTML=markup;
  document.title=(base==='add'?'Add transaction':pretty(base in views || base==='edit'?base:'dashboard'))+' · Budgetwise';
  window.scrollTo(0,0);
}
function openDialog(markup) { dialog.innerHTML=markup; dialog.showModal(); }
function budgetDialog(category='') {
  const current=state.budgets[month] || {};
  openDialog(`<div class="between"><h2 id="dialog-title">A little room to plan</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><p>Set a category limit for ${monthLabel(month)}.</p><form id="budget-form" novalidate><div class="field"><label for="budget-category">Category</label><select id="budget-category" name="category">${M.categories.expense.map(c=>`<option ${category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label for="budget-limit">Monthly limit (UGX)</label><input id="budget-limit" name="limit" type="number" min="1" max="1000000000" step="1" value="${current[category || M.categories.expense[0]] || ''}" placeholder="e.g. 300000" required aria-describedby="budget-error"></div><p id="budget-error" class="error" role="alert"></p><div class="form-actions"><button class="btn secondary" type="button" data-action="close-dialog">Cancel</button><button class="btn" type="submit">Save budget</button></div></form>`);
}
function formValues(form) {
  const data=new FormData(form);
  return {type:data.get('type'),description:String(data.get('description') || '').trim(),amount:Number(data.get('amount')),category:String(data.get('category') || ''),date:String(data.get('date') || ''),note:String(data.get('note') || '').trim()};
}
function exportCsv(data,filename) {
  if (!data.length) {showToast('There are no transactions to export for this selection.');return;}
  const blob=new Blob(['\ufeff'+M.toCsv(data)],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob), anchor=document.createElement('a');
  anchor.href=url;anchor.download=filename+'.csv';document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Your CSV download is ready.');
}
document.addEventListener('submit',async event=>{
  const form=event.target;
  if (!['login-form','transaction-form','budget-form','settings-form'].includes(form.id)) return;
  event.preventDefault();
  if (form.id==='login-form') {
    const email=form.email.value.trim(), password=form.password.value;
    let message='';
    if (!email || !password) message='Enter both your email address and password.';
    else if (!form.email.validity.valid) message='Enter a valid email address.';
    else {
      const button=form.querySelector('button[type="submit"]');
      button.disabled=true;
      try { if (!await matchesLogin(email,password)) message='Email or password is incorrect.'; }
      catch { message='Sign-in is unavailable. Open the application using HTTPS or localhost.'; }
      finally { button.disabled=false; }
    }
    if(message){document.querySelector('#login-error').textContent=message;form.email.setAttribute('aria-invalid','true');form.password.setAttribute('aria-invalid','true');return;}
    setSession(true);navigate('dashboard');return;
  }
  if (form.id==='transaction-form') {
    const t=formValues(form), errors=M.validateTransaction(t);
    for (const field of ['description','amount','date','category','note']) {
      document.querySelector('#'+field+'-error').textContent=errors[field] || '';
      form.elements[field].setAttribute('aria-invalid',errors[field]?'true':'false');
    }
    if(Object.keys(errors).length){document.querySelector('#form-error').textContent='Please check the highlighted fields.';form.querySelector('[aria-invalid="true"]').focus();return;}
    const editId=form.dataset.editId;
    if(!editId && state.transactions.length>=5000){document.querySelector('#form-error').textContent='This demo supports up to 5,000 transactions. Remove a record before adding another.';return;}
    const next=cloneState();
    const entry={...t,id:editId || newTransactionId()};
    if(editId) next.transactions=next.transactions.map(x=>x.id===editId?entry:x);
    else next.transactions.push(entry);
    if(persist(next)){lastSaved=entry;month=entry.date.slice(0,7);navigate('summary');showToast(editId?'Transaction updated. Your summary is up to date.':'Transaction saved. Your summary is up to date.');}
  }
  if(form.id==='budget-form'){
    const category=form.elements.category.value, limit=Number(form.elements.limit.value);
    if(!M.categories.expense.includes(category) || !Number.isSafeInteger(limit) || limit<=0 || limit>M.maxAmount){document.querySelector('#budget-error').textContent='Enter a whole UGX limit from 1 to 1,000,000,000.';form.elements.limit.setAttribute('aria-invalid','true');form.elements.limit.focus();return;}
    const next=cloneState();next.budgets[month]={...(next.budgets[month] || {}),[category]:limit};
    if(persist(next)){dialog.close();render();showToast('Budget saved for '+monthLabel(month)+'.');}
  }
  if(form.id==='settings-form'){
    const name=form.elements.name.value.trim(), goal=Number(form.elements.goal.value);
    if(!name || name.length>40 || form.elements.goal.value==='' || !Number.isSafeInteger(goal) || goal<0 || goal>M.maxAmount){document.querySelector('#settings-error').textContent='Enter a name (1–40 characters) and a whole savings goal from 0 to 1,000,000,000 UGX.';return;}
    const next=cloneState();next.profile.name=name;next.profile.savingsGoal=goal;
    if(persist(next)){render();showToast('Your preferences are saved.');}
  }
});
document.addEventListener('click',event=>{
  if(event.target.closest('.skip-link')){
    event.preventDefault();
    document.querySelector('#main')?.focus();
    return;
  }
  const control=event.target.closest('[data-action]');
  if(!control) return;
  const action=control.dataset.action;
  if(action==='logout'){setSession(false);toastBox.hidden=true;location.hash='#/login';render();}
  if(action==='toggle-password'){const input=document.querySelector('#login-password');input.type=input.type==='password'?'text':'password';control.setAttribute('aria-label',input.type==='password'?'Show password':'Hide password');}
  if(action==='close-dialog')dialog.close();
  if(action==='open-menu' || action==='close-menu'){
    const open=action==='open-menu';document.querySelector('.sidebar').classList.toggle('open',open);document.querySelector('.mobile-overlay').classList.toggle('visible',open);document.querySelector('[data-action="open-menu"]').setAttribute('aria-expanded',String(open));
    if(open)document.querySelector('.sidebar .nav-link').focus();
  }
  if(action==='budget')budgetDialog(control.dataset.category);
  if(action==='dismiss-toast'){toastBox.hidden=true;undoAction=null;}
  if(action==='undo' && undoAction){const fn=undoAction;undoAction=null;fn();}
  if(action==='delete'){
    const t=state.transactions.find(x=>x.id===control.dataset.id);if(!t)return;
    openDialog(`<div class="between"><h2 id="dialog-title">Remove this transaction?</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><p><strong>${esc(t.description)}</strong><br>${ugx(t.amount)} · ${pretty(t.type)} · ${dateLabel(t.date)}</p><p>Your balance and category totals will update. You can undo from the notification.</p><div class="form-actions"><button class="btn secondary" data-action="close-dialog">Keep it</button><button class="btn danger" data-action="confirm-delete" data-id="${esc(t.id)}">Remove transaction</button></div>`);
  }
  if(action==='confirm-delete'){
    const before=cloneState(), next=cloneState();next.transactions=next.transactions.filter(t=>t.id!==control.dataset.id);
    if(persist(next)){lastSaved=null;dialog.close();render();showToast('Transaction removed.',()=>{if(persist(before)){render();showToast('Transaction restored.');}});}
  }
  if(action==='reset')openDialog(`<div class="between"><h2 id="dialog-title">Start fresh with sample data?</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><p>This restores the original fictional transactions, budgets, display name, and goal. You can undo using the notification.</p><div class="form-actions"><button class="btn secondary" data-action="close-dialog">Keep my workspace</button><button class="btn" data-action="confirm-reset">Restore samples</button></div>`);
  if(action==='confirm-reset'){
    const before=cloneState();if(persist(M.seed())){lastSaved=null;month='2026-10';dialog.close();render();showToast('Original sample workspace restored.',()=>{if(persist(before)){render();showToast('Your previous workspace is restored.');}});}
  }
  if(action==='export')exportCsv(M.searchTransactions(state.transactions,{month,...filters}),'budgetwise-filtered-'+month);
  if(action==='export-report')exportCsv(M.searchTransactions(state.transactions,{month}),'budgetwise-'+month);
  if(action==='export-all')exportCsv([...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)),'budgetwise-all-transactions');
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='active-month' && /^\d{4}-(0[1-9]|1[0-2])$/.test(el.value) && el.value>='2000-01' && el.value<='2100-12'){month=el.value;render();}
  const keys={'filter-type':'type','filter-category':'category','filter-sort':'sort'};
  if(keys[el.id]){filters[keys[el.id]]=el.value;refreshLedger();}
  if(el.name==='type' && el.form?.id==='transaction-form')document.querySelector('#category').innerHTML=categoryOptions(el.value);
  if(el.id==='budget-category')document.querySelector('#budget-limit').value=state.budgets[month]?.[el.value] || '';
});
function refreshLedger(){const result=M.searchTransactions(state.transactions,{month,...filters});document.querySelector('#ledger-results').innerHTML=transactionTable(result,true);document.querySelector('#results-count').textContent=result.length+' matching transactions · '+monthLabel(month);}
document.addEventListener('input',event=>{
  if(event.target.id==='transaction-search'){filters.search=event.target.value;refreshLedger();}
  const form=event.target.closest('#transaction-form');
  if(form){
    const values=formValues(form), errors=M.validateTransaction(values), field=event.target.name;
    document.querySelector('#balance-preview').innerHTML=balancePreview(values,form.dataset.editId);
    if(['description','amount','date','category','note'].includes(field) && !errors[field]){
      document.querySelector('#'+field+'-error').textContent='';
      event.target.setAttribute('aria-invalid','false');
    }
    if(!Object.keys(errors).length)document.querySelector('#form-error').textContent='';
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('.mobile-overlay')?.classList.remove('visible');document.querySelector('[data-action="open-menu"]')?.setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{render();if(signedIn)document.querySelector('#main')?.focus({preventScroll:true});});
render();
