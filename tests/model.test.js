const {test} = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/model.js');
const valid = {type:'expense',description:'Groceries',amount:25000,category:'Food & groceries',date:'2026-10-24',note:''};

test('October sample totals reconcile exactly', () => {
  const data=M.monthTransactions(M.seed().transactions,'2026-10');
  assert.equal(data.length,14);
  assert.deepEqual(M.totals(data),{income:1850000,expenses:982000,balance:868000,status:'surplus',savingsRate:46.9});
});
test('Equal income and expenses produce a balanced result', () => {
  const result=M.totals([{type:'income',amount:100},{type:'expense',amount:100}]);
  assert.equal(result.balance,0);assert.equal(result.status,'balanced');assert.equal(result.savingsRate,0);
});
test('Expenses greater than income produce a deficit', () => {
  assert.equal(M.totals([{type:'income',amount:100},{type:'expense',amount:101}]).status,'deficit');
});
test('No income has no defined savings rate', () => {
  assert.equal(M.totals([{type:'expense',amount:1}]).savingsRate,null);
  assert.deepEqual(M.totals([]),{income:0,expenses:0,balance:0,status:'balanced',savingsRate:null});
});
test('An added expense updates the correct month and category', () => {
  const s=M.seed();s.transactions.push({...valid,id:'new'});
  const data=M.monthTransactions(s.transactions,'2026-10');
  assert.equal(M.totals(data).balance,843000);
  assert.equal(M.categoryTotals(data).find(c=>c.category==='Food & groceries').spent,235000);
  assert.equal(M.monthTransactions(s.transactions,'2026-11').length,0);
});
test('A valid transaction and the smallest amount are accepted', () => {
  assert.deepEqual(M.validateTransaction(valid),{});
  assert.deepEqual(M.validateTransaction({...valid,amount:1}),{});
});
test('Zero, negative, fractional, nonfinite and text amounts are rejected', () => {
  for(const amount of [0,-1,1.5,NaN,Infinity,'100',true,1e9+1])assert.ok(M.validateTransaction({...valid,amount}).amount);
});
test('The documented maximum amount is accepted', () => {
  assert.deepEqual(M.validateTransaction({...valid,amount:1e9}),{});
});
test('Required descriptions and notes have bounded lengths', () => {
  assert.ok(M.validateTransaction({...valid,description:'   '}).description);
  assert.ok(M.validateTransaction({...valid,description:'x'.repeat(81)}).description);
  assert.ok(M.validateTransaction({...valid,note:'x'.repeat(241)}).note);
});
test('Income cannot use an expense category', () => {
  assert.ok(M.validateTransaction({...valid,type:'income'}).category);
  assert.deepEqual(M.validateTransaction({...valid,type:'income',category:'Freelance'}),{});
});
test('Calendar validation rejects impossible dates and accepts leap day', () => {
  assert.equal(M.validDate('2026-02-29'),false);
  assert.equal(M.validDate('2024-02-29'),true);
  assert.equal(M.validDate('2026-13-01'),false);
  assert.ok(M.validateTransaction({...valid,date:'1999-12-31'}).date);
});
test('Search, type, category and month filters work together', () => {
  const s=M.seed();const result=M.searchTransactions(s.transactions,{month:'2026-10',type:'expense',category:'Food & groceries',search:'MARKET'});
  assert.equal(result.length,1);assert.equal(result[0].amount,72000);
});
test('Search can match notes without changing the source array', () => {
  const source=[{...valid,id:'note',note:'Campus stationery'}];const before=JSON.stringify(source);
  assert.equal(M.searchTransactions(source,{month:'2026-10',search:'CAMPUS'}).length,1);
  assert.equal(JSON.stringify(source),before);
});
test('Sorting largest and oldest is deterministic', () => {
  const rows=M.searchTransactions(M.seed().transactions,{month:'2026-10',sort:'largest'});
  assert.equal(rows[0].amount,1200000);
  assert.equal(M.searchTransactions(rows,{month:'2026-10',sort:'oldest'})[0].date,'2026-10-01');
});
test('Category totals exclude all income', () => {
  const rows=[{type:'income',category:'Housing',amount:9000},{type:'expense',category:'Housing',amount:100}];
  assert.equal(M.categoryTotals(rows).find(c=>c.category==='Housing').spent,100);
});
test('Saved-state validation rejects corruption and duplicate records', () => {
  assert.equal(M.validState(M.seed()),true);assert.equal(M.validState({}),false);
  const s=M.seed();s.transactions.push(s.transactions[0]);assert.equal(M.validState(s),false);
  const b=M.seed();b.budgets['2026-10'].Housing=-1;assert.equal(M.validState(b),false);
});
test('CSV quotes commas and quotes and prefixes spreadsheet formulas', () => {
  const csv=M.toCsv([{...valid,description:'=SUM(1,2)',note:'He said "hello"'}]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));assert.ok(csv.includes('"He said ""hello"""'));assert.ok(csv.includes('"-25000"'));
});
test('Independent sample workspaces do not share mutable arrays or limits', () => {
  const a=M.seed(),b=M.seed();a.transactions.pop();a.budgets['2026-10'].Housing=1;
  assert.equal(b.transactions.length,24);assert.equal(b.budgets['2026-10'].Housing,450000);
});
