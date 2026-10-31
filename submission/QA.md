# Checks performed

Date: 31 October 2026. Source revision: `ae70b9d0ef963b0e8175026d5faabf053cd83b44`. Documentation changes do not alter the application code.

## Automated checks

The existing `tests/model.test.js` suite was run with `node --test tests/model.test.js`: **18 passed, 0 failed**. It covers totals, deficits, validation, dates, filters, category totals, stored state and CSV handling. Both JavaScript source files also passed syntax checks.

## Live browser checks

| Action | Observed result | Status |
| --- | --- | --- |
| Submit empty login | Requests both email and password | Passed |
| Choose Explore the demo | Opens the October dashboard | Passed |
| Inspect starting totals | Income 1,850,000; expenses 982,000; balance 868,000 UGX | Passed |
| Submit empty transaction | Shows description, amount and category errors | Passed |
| Enter a 15,000 UGX transport expense | Preview shows 853,000 UGX balance | Passed |
| Save the expense | Summary shows expenses 997,000 and balance 853,000 UGX | Passed |
| Reload the summary | Saved entry and 853,000 UGX balance remain | Passed |

The live browser check used the desktop viewport. The mobile Figma frames were inspected separately. A fresh mobile browser test, full accessibility audit and participant usability study were not performed in this pass. The table records only checks actually observed.
