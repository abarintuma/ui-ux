# Budgetwise — Personal Budget Management System

A responsive UI/UX coursework prototype by Aaine Barintuma. Built with
plain **HTML, CSS, and JavaScript** so the screens and calculations are easy
to understand and demonstrate.

## Open the working interface

Open `dist/index.html` in a browser, or serve the `dist` folder:

```sh
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Python is only a convenient static file
server here; the UI/UX assignment itself runs in the browser.

Choose **Explore the demo**. Alternatively, use:

- Email: `demo@budgetwise.test`
- Password: `Budgetwise123!`

These are public sample credentials for a simulated sign-in. There is no
server authentication or bank connection. Transactions are fictional and
changes stay in local storage in the browser you use. Use sample data only.

## The complete journey

1. **Login** — visible labels, validation, password visibility, one-click demo.
2. **Overview** — monthly income, expenses, balance, savings rate, cash flow,
   category spending, recent transactions, and budget progress.
3. **Add transaction** — income/expense switch, amount/date/category validation,
   optional note, and live balance preview.
4. **Updated summary** — explicit saved entry and reconciled monthly totals.
5. **Transactions** — search, type/category/month filters, sorting, edit,
   confirmed delete with undo, and filtered CSV export.
6. **Budgets** — monthly category limits, progress, remaining/over-budget amounts.
7. **Reports** — six-month cash flow, exact category totals, savings-goal context,
   and export for the selected month.
8. **Settings** — display name, savings goal, all-record export, sample reset
   with undo, and clear explanations about local data.

All pages share navigation and work at narrow widths. Native HTML dialogs,
visible focus, input labels, text statuses, and a chart data table support
accessibility. This is not a claim of a full accessibility audit.

## Assignment materials

Start with the [simple illustrated PDF report](submission/Budgetwise_Report.pdf) or
[editable Word report](submission/Budgetwise_Report.docx). The [document index](submission/README.md)
and [assignment checklist](submission/CHECKLIST.md) show where each task is covered.


- [Brief report](submission/REPORT.md)
- [Research, intended users, and interview template](submission/RESEARCH.md)
- [Design decisions and tokens](submission/DESIGN.md)
- [Wireframes](submission/sketches/README.md)
- [Native editable Figma designs](https://www.figma.com/design/FQLOMqCsZITyL52DR6MInm)
- [Figma inventory and verification](submission/figma/README.md)
- [Browser and automated checks](submission/QA.md)
- [Presentation/demo guide](submission/PRESENTATION.md)
- [Implementation screenshots](submission/screenshots/)

The included wireframes are editable **digital** sketches. Genuine participant
research and photographs of personally drawn paper sketches must be supplied
by the student where the assessor requires those activities. The research
templates do not pretend interviews took place.

## Understand the code

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Document structure and asset loading |
| `dist/styles.css` | Design tokens, desktop/mobile layouts, focus and print styles |
| `dist/model.js` | Pure calculation, validation, filtering, sample-data and CSV functions |
| `dist/app.js` | Screen rendering, navigation, forms, browser storage, feedback |
| `tests/model.test.js` | 18 automated checks of the budget model |

The HTML contains `#app`, where JavaScript renders the current screen. Links
change the URL hash, for example `#/transactions`. The `render` function
chooses a screen. The screens call the same pure model functions, so changes
to a record update every summary consistently.

`localStorage` holds records and preferences under `budgetwise-v1`.
`sessionStorage` remembers that the user entered the demonstration. This is
navigation state, not an authentication boundary. DOM output escapes entered
text. CSV output quotes text and guards formula-like cell values.

Amounts are positive whole UGX from 1 to 1,000,000,000 per transaction.
Income or expense supplies the direction. The remaining balance is
`total income - total expenses` and can be positive, zero, or negative.
Savings rate is `balance / income * 100`; no income means the rate is
undefined and the UI displays a dash. The demo supports 5,000 records.

## Run automated checks

Use Node.js 20 or later. No npm installation is needed:

```sh
node --test tests/model.test.js
node --check dist/model.js
node --check dist/app.js
```

The actual recorded model run passed **18 tests**. The Python/pytest assignment in `abarintuma/software-testing` remains a separate exercise. It is not a backend for this prototype.

## Deploy on Vercel

Import **abarintuma/ui-ux** as a new Vercel project. Use the **Other** framework preset and keep the repository root as the Root Directory. This is a static site: there is no package installation or build step. The included `vercel.json` sets **dist** as the Output Directory. Select Deploy in Vercel when ready. Hash routes such as `#/transactions` work without server rewrites. No environment variables are required.

Reference: [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json) and [static builds](https://vercel.com/docs/builds).

The native Figma prototype is designed for **mobile phones**. The web implementation adapts to both mobile and desktop screens. The sample user is named **Aine**.

## Demo in two minutes

Open the demo, inspect October 2026, then add a **15,000 UGX transport
expense**. Starting sample totals are income **1,850,000**, expenses
**982,000**, and balance **868,000**. After saving, expenses become
**997,000** and balance **853,000**. Find the new record in Transactions and
edit it to **12,000**; the balance becomes **856,000**. Explain the validation,
local persistence, and why a deficit is a valid outcome. See the longer
presentation guide for the remaining demonstration.

The starting month is October 2026 to keep coursework screenshots reproducible.
Use the month picker for another month. New months begin empty, with no category
limits until you set them. Dates from 2000 through 2100 are supported.
