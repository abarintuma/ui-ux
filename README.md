# Budgetwise Personal Budget Management System

**Ainemukama Alfred**  
UI/UX Design coursework

Budgetwise records income and expenses and calculates the amount remaining each month. It is built with HTML, CSS and JavaScript, with a responsive layout for phones and computers.

## Main user journey

Login → Budget dashboard → Add transaction → Updated summary.

The application also includes a transaction list, category budgets, reports and settings. Transactions can be searched, edited, deleted and exported as CSV.

## Run the application

Open `dist/index.html` in a browser, or serve the application locally:

```sh
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000` and sign in with the configured account, or choose **Create account**. Enter your name, email and a password of at least eight characters. New accounts start with an empty budget and keep their records separately in the same browser. Login details are not displayed in the interface or documentation.

## Coursework materials

- [PDF report](submission/Budgetwise_Report.pdf)
- [Project report](submission/REPORT.md)
- [User research](submission/RESEARCH.md)
- [Problem and requirements](submission/REQUIREMENTS.md)
- [Hand-drawn wireframes](submission/sketches/wireframes.jpeg)
- [Mobile screenshots](submission/screenshots/README.md)
- [Figma designs](https://www.figma.com/design/FQLOMqCsZITyL52DR6MInm)
- [Figma screen overview](submission/screenshots/figma-designs.png)

## Project files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Loads the application |
| `dist/styles.css` | Colours, typography and responsive layout |
| `dist/model.js` | Transactions, calculations and validation rules |
| `dist/app.js` | Screens, navigation, forms and browser storage |
| `vercel.json` | Static deployment configuration |

Amounts are entered in whole Uganda shillings. The monthly balance is total income minus total expenses. Records and preferences are saved in the browser.

## Repository

[https://github.com/ainemukama-alfred/ui-ux](https://github.com/ainemukama-alfred/ui-ux)

## Deploy

Import the repository into Vercel. Select the Other framework preset, leave the build command empty and use `dist` as the output directory. The included `vercel.json` sets the output directory.
