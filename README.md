# Serviceline — QR-Based Equipment & Service Management System

A working demonstration of a centralised platform for managing fire-safety and
industrial equipment across multiple customers and sites. Every item carries a
unique QR code; scanning it with a phone opens that item's record — after sign-in
and a customer/site permission check.

**Live demo:** _(add your GitHub Pages URL here once deployed)_

---

## What it demonstrates

| Area | What works in this build |
| --- | --- |
| **QR generation** | A real QR code per item, resolving to `…/#/e/<ID>`. Single label preview with PNG download, plus a batch label sheet you can print per site. |
| **QR scanning** | The phone camera decodes the label and opens the record. Manual ID entry and a demo picker cover desktops and blocked cameras. |
| **Deep-link security** | Scanning while signed out lands on sign-in, which remembers the target and continues to it after authentication. |
| **Roles** | Administrator, Manager, Service Engineer, Client User, Viewer. Engineers see only assigned sites; client users see only their own company. Out-of-scope equipment returns *Access restricted*, not the record. |
| **Service history** | Full timeline per item with type, engineer, result, remarks, checklist outcome and photographs. |
| **Inspection** | Category-specific checklists — 9 points for extinguishers, 7 for fire pumps, and so on. Failing any point marks the whole visit failed and tags the equipment out of service. |
| **Photos** | Captured from the phone camera, downscaled in the browser, stored with the record. |
| **Reminders** | Buckets for overdue, due today, 7 / 30 / 90 days, and cylinder expiry within 30 days. |
| **Reports** | Six reports, each scoped to the signed-in user, exported as CSV. |
| **Audit trail** | Sign-in, equipment access, QR scans, service records, requests, label generation and exports, all recorded against the individual account. |

Equipment status is derived from dates rather than stored, so it can never go
stale. Two states are set by hand and override the dates: *Under maintenance*
and *Failed inspection*.

## Demo accounts

No passwords — pick an account on the sign-in screen.

| Account | Role | Sees |
| --- | --- | --- |
| Nabil Haddad | Administrator | Everything |
| Sara Ibrahim | Manager | All customers, no user administration |
| Ahmed Al-Otaibi | Service Engineer | 3 sites at Al-Rajhi Industrial |
| Mohammed Farooq | Service Engineer | 4 sites across Gulf Petrochem and Nesma |
| Khalid Al-Rajhi | Client User | Al-Rajhi Industrial only; can raise service requests |
| Layla Nasser | Viewer | Gulf Petrochem, read-only |

To see the permission model working, sign in as Ahmed and open a Gulf Petrochem
item — the record is refused, not merely hidden.

## Running it on your own machine

**Double-click `start-demo.cmd`.** It installs dependencies on first run, then
starts the server over HTTPS and opens your browser. Press Ctrl+C twice in that
window to stop it.

Or from a terminal:

```bash
npm install
npm run dev         # http://localhost:5173 — desktop work
npm run dev:phone   # https, reachable from your phone
npm run build       # production bundle into dist/
npm run preview     # serve that bundle locally
```

### Scanning with your phone against this machine

Browsers only give a page the camera on a *secure origin*. `localhost` counts as
secure; `192.168.x.x` does not — so `npm run dev:phone` serves HTTPS with a
self-signed certificate.

1. Start it. Vite prints two addresses — use the **Network** one on the phone.
2. Both devices must be on the same Wi-Fi.
3. The phone will warn that the certificate is not trusted. That is expected for
   a local demo: tap **Advanced → Proceed** (Android) or **Show Details → visit
   this website** (iOS). The camera works once you are through.
4. Sign in, tap **Scan**, and point it at a label from the **QR labels** page.

If the phone cannot reach the address at all, Windows Firewall is usually
blocking Node — allow it on private networks, or run the demo on the deployed
site instead.

> **Labels printed locally only work locally.** A QR generated while running on
> your machine encodes `https://192.168.x.x:5173/…`, which is dead outside your
> Wi-Fi and once the server stops. Print labels a client will actually use from
> the deployed GitHub Pages address.

On a desktop with no camera, the Scan page's manual ID field and demo picker do
the same job.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
   publishes automatically.

The workflow passes `VITE_BASE=/<repo-name>/` so asset paths match a project
site. Routing uses `HashRouter` because GitHub Pages cannot rewrite
`/e/FE-000125` back to `index.html` — deep links live after the `#`.

Renaming the repository changes the URL, and therefore the URL encoded into any
label already printed. Print labels from the final address.

## Technology

React 18 · Vite 6 · React Router 6 · `qrcode.react` for generation ·
`html5-qrcode` for camera decoding. No CSS framework — the design system is
about 700 lines of hand-written CSS driven by custom properties, with light and
dark themes and a mobile-first layout.

The scanner is code-split, so the camera decoder (~100 kB gzipped) downloads
only when someone taps Scan. The rest of the app is ~81 kB gzipped.

## How the demo stores data

Everything lives in the browser's `localStorage`, so the demo needs no server and
each visitor gets their own private copy. Anything you add stays on your device.
**Audit trail → Reset demo data** restores the original dataset.

Seed dates are rebased against the current date on first load, so the dashboard
always opens with a realistic spread of overdue and upcoming work rather than a
dataset that ages out.

## What production would add

This build is the front end and the interaction model. A production deployment
per the proposal replaces browser storage with:

- **FastAPI** backend and **MySQL** database
- Password authentication with hashing, sessions and server-side authorisation —
  the role checks here are demonstrations of the model, not a security boundary
- Server-side scheduled reminders with email delivery
- File storage for photographs and documents
- Historical data import from Excel/CSV
- Server-side audit logging

---

Sample data only. Customers, sites, engineers and service records in this demo
are fictional and contain no real customer information.
