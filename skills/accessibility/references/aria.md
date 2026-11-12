# ARIA Patterns Reference

Source: WAI-ARIA 1.2, ARIA Authoring Practices Guide (APG), Accessible Name and Description Computation 1.1

## When to use ARIA

**Rule 1 — Use native HTML first.** If you can use a native HTML element with the correct semantics, do that instead of ARIA.

```html
<!-- Prefer this: -->
<button type="button">Save</button>
<!-- Over this: -->
<div role="button" tabindex="0">Save</div>
```

**Rule 2 — Don't change native semantics unless necessary.**
**Rule 3 — All interactive ARIA controls must be keyboard-operable.**
**Rule 4 — Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements.**
**Rule 5 — All interactive elements must have an accessible name.**

---

## Accessible Names and Descriptions

The accessible name computation (in order of precedence):

1. `aria-labelledby` — references other elements by ID
2. `aria-label` — inline string
3. Native label mechanism (e.g., `<label>` for inputs, `alt` for images, `<caption>` for tables, `<title>` for SVGs)
4. `title` attribute (least preferred — tooltip, not reliable as primary name)

### Common patterns

```html
<!-- Input with visible label -->
<label for="email">Email address</label>
<input id="email" type="email" />

<!-- Input with aria-label (no visible label) -->
<input type="search" aria-label="Search products" />

<!-- Input with aria-labelledby -->
<span id="amount-label">Amount</span>
<input type="number" aria-labelledby="amount-label" aria-describedby="amount-hint" />
<span id="amount-hint">Enter whole dollars</span>

<!-- Icon button (visible icon, no text) -->
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<!-- Image -->
<img src="chart.png" alt="Bar chart: Q3 revenue $4.2M, up 12% from Q2" />
<img src="divider.png" alt="" />   <!-- decorative: empty alt -->
```

---

## Common ARIA Roles

### Landmark roles

Used for page regions. Screen reader users navigate by landmarks.

| Role | HTML equivalent | Use for |
|---|---|---|
| `banner` | `<header>` (top-level) | Site header |
| `navigation` | `<nav>` | Navigation menus |
| `main` | `<main>` | Main content |
| `complementary` | `<aside>` | Related supplementary content |
| `contentinfo` | `<footer>` (top-level) | Site footer |
| `search` | `<search>` | Search region |
| `form` | `<form>` (with accessible name) | Form region |
| `region` | `<section>` (with accessible name) | Labeled content section |

Label landmarks with `aria-label` or `aria-labelledby` when the same role appears more than once.

```html
<nav aria-label="Main">...</nav>
<nav aria-label="Breadcrumb">...</nav>
```

### Widget roles (common)

| Role | Use for | Key keyboard |
|---|---|---|
| `button` | Clickable action | Enter, Space |
| `link` | Navigation | Enter |
| `checkbox` | Binary toggle | Space |
| `radio` + `radiogroup` | Single-select group | Arrow keys within group |
| `combobox` | Editable select with popup | Enter opens, Escape closes, Arrows navigate |
| `listbox` + `option` | Select-from-list | Arrows, Enter, Escape |
| `menu` + `menuitem` | Application menu | Arrows navigate, Enter activates, Escape closes |
| `dialog` | Modal overlay | Trap focus inside; Escape closes |
| `alertdialog` | Modal dialog requiring response | Same as dialog |
| `tablist` + `tab` + `tabpanel` | Tabbed interface | Arrow keys switch tabs |
| `tree` + `treeitem` | Hierarchical list | Arrows, Enter, Escape |
| `grid` + `row` + `gridcell` | Interactive data grid | Arrow keys navigate cells |
| `slider` | Range input | Arrow keys change value |
| `spinbutton` | Numeric input with increment | Arrow keys increment/decrement |
| `tooltip` | Contextual hint | Escape dismisses |
| `progressbar` | Progress indicator | (non-interactive) |
| `alert` | Urgent message (auto-announced) | (non-interactive) |
| `status` | Non-urgent status update | (non-interactive) |
| `log` | Scrolling log (chat, activity) | (live region) |

---

## Key ARIA States and Properties

### States (change dynamically)

| Attribute | Values | Use for |
|---|---|---|
| `aria-expanded` | true/false | Toggle buttons, accordions, comboboxes, menus |
| `aria-selected` | true/false | Tabs, listbox options, grid cells |
| `aria-checked` | true/false/mixed | Checkboxes, menu items with checkmarks |
| `aria-pressed` | true/false/mixed | Toggle buttons |
| `aria-disabled` | true/false | Disabled (but focusable) elements |
| `aria-hidden` | true/false | Remove from accessibility tree |
| `aria-invalid` | true/false/grammar/spelling | Form validation errors |
| `aria-busy` | true/false | Loading/updating regions |
| `aria-current` | page/step/location/date/time/true | Current item in navigation/breadcrumb |

### Properties (generally static)

| Attribute | Use for |
|---|---|
| `aria-label` | Accessible name string |
| `aria-labelledby` | Accessible name from other elements |
| `aria-describedby` | Additional description from other elements |
| `aria-controls` | Element(s) this one controls |
| `aria-owns` | Owned elements not in DOM hierarchy |
| `aria-haspopup` | Popup type: menu/listbox/tree/grid/dialog |
| `aria-live` | Live region politeness: off/polite/assertive |
| `aria-atomic` | Whether live region announces whole or parts |
| `aria-relevant` | What changes trigger live region: additions/removals/text |
| `aria-required` | Field required (supplement native `required`) |
| `aria-multiselectable` | Multiple items can be selected |
| `aria-sort` | Table column sort direction |
| `aria-valuemin/max/now/text` | Range/slider values |
| `aria-level` | Heading level for `role="heading"` |
| `aria-setsize` / `aria-posinset` | Position in a set |
| `aria-rowcount` / `aria-colcount` | Total rows/cols in large grids |
| `aria-placeholder` | Hint text for empty fields |
| `aria-autocomplete` | Input autocomplete type: none/inline/list/both |

---

## Common Component Patterns

### Accordion

```html
<h3>
  <button
    type="button"
    aria-expanded="false"
    aria-controls="section1-panel"
    id="section1-btn"
  >
    Section 1
  </button>
</h3>
<div
  id="section1-panel"
  role="region"
  aria-labelledby="section1-btn"
  hidden
>
  Panel content...
</div>
```

### Modal dialog

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Confirm deletion</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
  <button type="button">Cancel</button>
  <button type="button">Delete</button>
</div>
```

`aria-modal="true"` tells screen readers (including JAWS) to scope their virtual cursor/browse mode to the dialog only — background page content will not be announced while the dialog is open. Without it, JAWS and some other ATs may still read surrounding page content. Note: `aria-modal` does *not* replace a JavaScript focus trap; both are required.

On open: move focus to first focusable element (or the dialog itself).
Trap focus inside (cycle Tab/Shift+Tab within the dialog).
On close: return focus to the element that triggered the dialog.

### Tabs

```html
<div role="tablist" aria-label="Account settings">
  <button role="tab" id="tab-profile" aria-selected="true"  aria-controls="panel-profile">Profile</button>
  <button role="tab" id="tab-security" aria-selected="false" aria-controls="panel-security" tabindex="-1">Security</button>
</div>
<div id="panel-profile"  role="tabpanel" aria-labelledby="tab-profile">...</div>
<div id="panel-security" role="tabpanel" aria-labelledby="tab-security" hidden>...</div>
```

Keyboard: Left/Right arrows move between tabs. Only the active tab is in the tab sequence (others `tabindex="-1"`). Follow the "roving tabindex" pattern.

### Combobox (editable + listbox)

```html
<label for="state-input">State</label>
<input
  id="state-input"
  type="text"
  role="combobox"
  aria-expanded="false"
  aria-controls="state-listbox"
  aria-autocomplete="list"
  aria-activedescendant=""
/>
<ul id="state-listbox" role="listbox" aria-label="States">
  <li id="opt-ca" role="option">California</li>
  <li id="opt-ny" role="option">New York</li>
</ul>
```

### Live regions

```html
<!-- Status messages (polite — waits for user to finish) -->
<div role="status" aria-live="polite" aria-atomic="true">
  Form saved successfully.
</div>

<!-- Alerts (assertive — interrupts immediately) -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: please correct 3 fields.
</div>

<!-- Inject content dynamically; don't use aria-hidden then unhide -->
```

---

## Focus Management

- **Modals**: trap focus inside while open; restore on close.
- **Page transitions (SPAs)**: on route change, move focus to `<main>` or the new page heading.
- **Dynamic content insertion**: move focus to the newly revealed content, or to a status message.
- **Disclosure widgets**: focus stays on the trigger (accordion buttons). Only move focus if the content needs immediate interaction.
- **Toast/snackbar**: don't steal focus. Use `role="status"` for polite announcements.
- **Error summary**: move focus to the error summary heading after form submission fails.

Never use `outline: none` / `outline: 0` without providing a clear, visible alternative focus indicator.

---

## SVG Accessibility

```html
<!-- Informative SVG -->
<svg role="img" aria-label="Company logo: blue circle with white star">
  ...
</svg>

<!-- Or with title element (less reliable) -->
<svg role="img" aria-labelledby="svg-title">
  <title id="svg-title">Download report</title>
  ...
</svg>

<!-- Decorative SVG (hidden from AT) -->
<svg aria-hidden="true" focusable="false">...</svg>
```
