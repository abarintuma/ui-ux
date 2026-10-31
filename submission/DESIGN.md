# Design notes

## Design thinking

1. **Empathise:** identify students and other people managing personal income as proposed users; review their likely tasks. Participant interviews remain to be done.
2. **Define:** users need one place to record money and see what remains.
3. **Ideate:** compare a long transaction list with a summary dashboard.
4. **Prototype:** draw the digital wireframes, use the existing mobile Figma designs and implement the interface in HTML, CSS and JavaScript.
5. **Test:** check calculations, validation and the main browser journey; collect participant feedback separately.

## Ideas considered

| Idea | Benefit | Limitation |
| --- | --- | --- |
| A list of every transaction first | Easy to inspect individual entries | The user must look harder for the balance |
| A dashboard first | Shows income, expenses and balance immediately | Detailed records need a separate view |

The dashboard idea was selected because it makes the monthly position visible before the user adds another entry. This is the rationale for the existing layout, not a claim that users voted for it.

## Three main interfaces

- **Login:** labelled email and password fields, show-password control, sign-in button and demo entry.
- **Budget dashboard:** month selector, summary cards, spending information and a clear Add transaction action.
- **Add transaction and summary:** type switch, short form, balance preview, Save and Cancel; after saving, show confirmation and new totals.

## Navigation

The main journey is Login → Overview → Add transaction → Updated summary. Overview, Transactions, Budgets, Reports and Settings share navigation. On small screens, the menu opens navigation. Cancel returns to Transactions without saving.

## Visual choices

| Item | Value in the web code | Purpose |
| --- | --- | --- |
| Main dark green | `#183e32` | Brand, navigation and strong emphasis |
| Action green | `#28654c` | Main actions and links |
| Light green | `#d8eca4` | Highlights |
| Background | `#f7f8f2` | Calm background |
| Text | `#203b31` | Main readable text |
| Error colour | `#a53a32` | Validation feedback |
| Body font | DM Sans with Arial fallback | Labels, numbers and body text |
| Main heading font | Lora with Georgia fallback | Screen headings |
| Main corner radius | 18px | Consistent card shape |

These values come from `dist/styles.css`. Labels remain visible above fields, focus states help keyboard use, and text identifies income, expenses and errors. These are implemented accessibility features, not a completed accessibility certification.

## Design evidence

See [mobile Figma frames](figma/README.md), [digital wireframes](sketches/README.md) and [actual website screenshots](screenshots/README.md). Figma shows the intended mobile designs; the website also supports wider screens. They are separate artefacts and are not claimed to be pixel-identical.
