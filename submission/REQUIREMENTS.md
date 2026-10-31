# Problem and User Requirements

## Problem statement

Keeping income and expense records in different places makes it difficult to see how much money remains. Budgetwise brings these records together and calculates monthly totals so that users can understand their spending more easily.

## Main requirements

| ID | Requirement | Interface feature |
| --- | --- | --- |
| R1 | Sign in to the application | Email and password form |
| R2 | View the monthly financial position | Income, expenses and balance cards |
| R3 | Record income or an expense | Transaction form and type switch |
| R4 | Avoid incomplete entries | Required fields and validation messages |
| R5 | See totals after saving | Updated summary and saved entry |
| R6 | Move between screens | Navigation menu, back and cancel actions |
| R7 | Use the interface on a phone | Responsive layout and readable fields |
| R8 | Keep records after reloading | Browser local storage |

## User journey

Login → Budget dashboard → Add transaction → Updated summary.

## Transaction details

Each transaction has a type, description, amount, date and category. A note is optional. The amount must be a positive whole number from 1 to 1,000,000,000 UGX. The date must be between 2000 and 2100, and the category must match the transaction type.

## Calculation rules

- Total income is the sum of income entries for the selected month.
- Total expenses is the sum of expense entries for the selected month.
- Remaining balance = total income − total expenses.
- A negative balance is shown as a deficit.
- Editing or deleting an entry updates the totals.
