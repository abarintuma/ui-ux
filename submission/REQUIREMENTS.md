# Problem and user requirements

## Problem statement

People need an easy way to record income and expenses and see the money remaining for the month. When records are scattered or totals are calculated manually, it can be difficult to understand spending. Budgetwise brings entries and totals into one simple interface. This problem framing comes from the assignment and needs participant validation.

## Main requirements

| ID | User requirement | How it is supported |
| --- | --- | --- |
| R1 | Enter the application | Login screen and public demo option |
| R2 | See the monthly financial position | Dashboard with income, expenses and balance |
| R3 | Add an income or expense | Transaction form with type, description, amount, date and category |
| R4 | Avoid saving incomplete entries | Required fields and clear validation messages |
| R5 | See the result after saving | Updated summary and latest saved record |
| R6 | Move easily between screens | Shared navigation and back/cancel links |
| R7 | Use a phone or computer | Responsive HTML and CSS layout |
| R8 | Keep sample records after reload | Browser local storage |

## Required journey

Login → Budget dashboard → Add transaction → Updated summary.

The third required interface includes the entry form and its saved summary state. The prototype gives the summary its own view to make the result clear.

## Rules

- All amounts use whole Uganda shillings, from 1 to 1,000,000,000 per transaction.
- Income adds to the balance; expenses subtract from it.
- Balance = total income − total expenses for the selected month.
- Required fields are description, amount, date, category and transaction type.
- Notes are optional. Dates are supported from 2000 through 2100.
- A negative balance is allowed and shown as a deficit.

## Scope

This coursework uses fictional sample data, browser storage and basic JavaScript calculations. Login is simulated. There is no bank connection, real account service or server backup.
