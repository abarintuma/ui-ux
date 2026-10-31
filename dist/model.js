/* Pure budget rules. The UI calls these functions; no DOM or storage here. */
(function (root) {
  'use strict';
  const categories = {
    income: ['Salary & allowance', 'Freelance', 'Family support', 'Other income'],
    expense: ['Housing', 'Food & groceries', 'Transport', 'Utilities', 'Education', 'Health', 'Leisure', 'Other expenses']
  };
  const defaultLimits = {Housing: 450000, 'Food & groceries': 300000, Transport: 150000, Utilities: 150000, Education: 150000, Health: 100000, Leisure: 100000, 'Other expenses': 100000};
  const maxAmount = 1000000000;
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validateTransaction(values) {
    const errors = {};
    if (!['income', 'expense'].includes(values.type)) errors.type = 'Choose income or expense.';
    if (typeof values.description !== 'string' || !values.description.trim() || values.description.trim().length > 80) errors.description = 'Enter a description between 1 and 80 characters.';
    if (!Number.isSafeInteger(values.amount) || values.amount <= 0 || values.amount > maxAmount) errors.amount = 'Enter a whole UGX amount from 1 to 1,000,000,000.';
    if (!(categories[values.type] || []).includes(values.category)) errors.category = 'Choose a category for this transaction type.';
    if (!validDate(values.date) || values.date < '2000-01-01' || values.date > '2100-12-31') errors.date = 'Choose a valid date between 2000 and 2100.';
    if (typeof values.note !== 'string' || values.note.length > 240) errors.note = 'Keep the note to 240 characters or fewer.';
    return errors;
  }
  function monthTransactions(transactions, month) {
    return transactions.filter(t => t.date.slice(0, 7) === month);
  }
  function totals(transactions) {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    return {income, expenses, balance, status: balance > 0 ? 'surplus' : balance < 0 ? 'deficit' : 'balanced', savingsRate: income ? Math.round(balance / income * 1000) / 10 : null};
  }
  function categoryTotals(transactions) {
    return categories.expense.map(category => ({category, spent: transactions.filter(t => t.type === 'expense' && t.category === category).reduce((sum, t) => sum + t.amount, 0)}));
  }
  function searchTransactions(transactions, {month, type = 'all', category = 'all', search = '', sort = 'newest'}) {
    const query = search.trim().toLowerCase();
    return monthTransactions(transactions, month).filter(t =>
      (type === 'all' || t.type === type) && (category === 'all' || t.category === category) &&
      [t.description, t.category, t.note].some(value => value.toLowerCase().includes(query))
    ).sort((a, b) => sort === 'largest' ? b.amount - a.amount : sort === 'oldest' ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id) : b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }
  function seed() {
    const entries = [
      ['01','income','Internship allowance',1200000,'Salary & allowance'],
      ['05','income','Website design project',450000,'Freelance'],
      ['08','income','Family support',200000,'Family support'],
      ['02','expense','October rent',400000,'Housing'],
      ['04','expense','Weekly groceries',110000,'Food & groceries'],
      ['07','expense','Transport top-up',65000,'Transport'],
      ['09','expense','Electricity & water',85000,'Utilities'],
      ['12','expense','Monthly data bundle',50000,'Utilities'],
      ['14','expense','Course books',90000,'Education'],
      ['18','expense','Lunch with friends',28000,'Food & groceries'],
      ['21','expense','Groceries at the market',72000,'Food & groceries'],
      ['22','expense','Coffee & a catch-up',12000,'Leisure'],
      ['23','expense','Gym membership',45000,'Health'],
      ['23','expense','Music subscription',25000,'Leisure']
    ];
    const transactions = entries.map((e, i) => ({id: 'oct-' + String(i).padStart(2, '0'), date: '2026-10-' + e[0], type: e[1], description: e[2], amount: e[3], category: e[4], note: ''}));
    [5,6,7,8,9].forEach((month, i) => {
      const mm = String(month).padStart(2, '0');
      transactions.push({id:'history-income-'+mm,date:'2026-'+mm+'-01',type:'income',description:'Monthly income',amount:[1400000,1600000,1500000,1750000,1800000][i],category:'Salary & allowance',note:'Sample historical total'});
      transactions.push({id:'history-expense-'+mm,date:'2026-'+mm+'-24',type:'expense',description:'Monthly living expenses',amount:[1100000,1250000,1000000,1180000,1300000][i],category:'Other expenses',note:'Sample historical total'});
    });
    return {version:1,profile:{name:'Ainemukama Alfred',email:'',savingsGoal:300000},transactions,budgets:{'2026-10':{...defaultLimits}}};
  }
  function validState(state) {
    if (!state || state.version !== 1 || !state.profile || typeof state.profile.name !== 'string' || !state.profile.name.trim() || state.profile.name.length > 40 || typeof state.profile.email !== 'string' || state.profile.email.length > 100 || !Number.isSafeInteger(state.profile.savingsGoal) || state.profile.savingsGoal < 0 || state.profile.savingsGoal > maxAmount || !Array.isArray(state.transactions) || state.transactions.length > 5000 || !state.budgets || typeof state.budgets !== 'object' || Array.isArray(state.budgets)) return false;
    const ids = new Set();
    for (const t of state.transactions) {
      if (!t || typeof t.id !== 'string' || ids.has(t.id) || Object.keys(validateTransaction(t)).length) return false;
      ids.add(t.id);
    }
    return Object.entries(state.budgets).every(([month, limits]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && limits && typeof limits === 'object' && !Array.isArray(limits) && Object.entries(limits).every(([category, limit]) => categories.expense.includes(category) && Number.isSafeInteger(limit) && limit > 0 && limit <= maxAmount));
  }
  function csvCell(value) {
    let text = String(value);
    if (typeof value === 'string' && /^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCsv(transactions) {
    const rows = [['Date','Description','Type','Category','Amount (UGX)','Note'], ...transactions.map(t => [t.date,t.description,t.type,t.category,t.type === 'expense' ? -t.amount : t.amount,t.note])];
    return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  const model = {categories,defaultLimits,maxAmount,validDate,validateTransaction,monthTransactions,totals,categoryTotals,searchTransactions,seed,validState,toCsv};
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  root.BudgetModel = model;
})(typeof window !== 'undefined' ? window : globalThis);
